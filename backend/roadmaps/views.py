import json
import logging

import anthropic
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Checklist, Progress, Roadmap, Week
from .serializers import (
    ChecklistSerializer,
    ProgressSerializer,
    RoadmapSerializer,
    WeekSerializer,
)

logger = logging.getLogger(__name__)

# AI 생성 입력 허용 범위 (프론트 슬라이더 범위와 일치시킬 것)
MIN_WEEKS, MAX_WEEKS = 1, 16
MIN_DAILY_HOURS, MAX_DAILY_HOURS = 0.5, 12
MAX_GOAL_LENGTH = 500

PROMPT_TEMPLATE = """당신은 학습 로드맵 전문가입니다.
아래 정보를 바탕으로 상세한 학습 로드맵을 JSON 형식으로 생성해주세요.

목표: {goal}
카테고리: {category}
기간: {duration_weeks}주
하루 학습 시간: {daily_hours}시간
현재 수준: {current_level}

정확히 {duration_weeks}개의 주차를 생성하고, 각 주차마다 다음을 포함하세요:
1. 주차 제목
2. 학습 내용 설명 (200자 이내)
3. 예상 소요 시간
4. 실제로 접근 가능한 학습 자료 2-3개
5. 실습 프로젝트
6. 체크리스트 3개

설명 없이 JSON만 출력하세요:
{{
  "roadmap_title": "제목",
  "weeks": [
    {{
      "week_number": 1,
      "title": "1주차 제목",
      "description": "설명",
      "estimated_hours": 10,
      "resources": [{{"title": "자료명", "url": "https://example.com", "type": "video"}}],
      "project_suggestion": "프로젝트",
      "checklists": ["항목1", "항목2", "항목3"]
    }}
  ]
}}"""


def _extract_json(text: str) -> str:
    """모델 응답에서 JSON 본문만 추출한다."""
    if "```json" in text:
        return text.split("```json", 1)[1].split("```", 1)[0].strip()
    if "```" in text:
        return text.split("```", 1)[1].split("```", 1)[0].strip()
    return text.strip()


class OwnedByUserMixin:
    """
    요청자가 소유한 로드맵에 속한 객체만 노출한다.

    ⚠️ roadmaps 앱에 ViewSet을 추가할 때는 반드시 이 믹스인을 상속하거나
       동등한 소유자 필터를 직접 구현할 것. 누락 시 IDOR 취약점이 된다.
    """

    owner_lookup = None  # 예: "roadmap__user", "week__roadmap__user"

    def get_queryset(self):
        return self.queryset.filter(**{self.owner_lookup: self.request.user})


class RoadmapViewSet(viewsets.ModelViewSet):
    serializer_class = RoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 중첩 직렬화(weeks → checklists)로 인한 N+1 쿼리 방지
        return (
            Roadmap.objects.filter(user=self.request.user)
            .prefetch_related("weeks__checklists", "progress")
        )

    def get_throttles(self):
        if self.action == "generate":
            self.throttle_scope = "roadmap_generate"
        return super().get_throttles()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def generate(self, request):
        """Claude API로 학습 로드맵을 생성한다."""
        params, error = self._validate_generate_input(request.data)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.ANTHROPIC_API_KEY:
            logger.error("ANTHROPIC_API_KEY가 설정되지 않았습니다.")
            return Response(
                {"error": "AI 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            message = client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=8000,
                messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(**params)}],
            )
            roadmap_data = json.loads(_extract_json(message.content[0].text))
        except anthropic.APIStatusError:
            logger.exception("Anthropic API 호출 실패")
            return Response(
                {"error": "AI 서비스 응답에 실패했습니다. 잠시 후 다시 시도해주세요."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except (json.JSONDecodeError, IndexError, KeyError):
            logger.exception("AI 응답 파싱 실패")
            return Response(
                {"error": "AI 응답을 해석하지 못했습니다. 다시 시도해주세요."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception:
            logger.exception("로드맵 생성 중 예기치 못한 오류")
            return Response(
                {"error": "로드맵 생성에 실패했습니다. 다시 시도해주세요."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        roadmap = self._persist_roadmap(request.user, params, roadmap_data)
        serializer = self.get_serializer(roadmap)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _validate_generate_input(data):
        """AI 호출 전에 입력을 검증한다(비용·토큰 남용 방지)."""
        goal = (data.get("goal") or "").strip()
        category = (data.get("category") or "").strip()

        if not goal or not category:
            return None, "goal과 category는 필수입니다."
        if len(goal) > MAX_GOAL_LENGTH:
            return None, f"학습 목표는 {MAX_GOAL_LENGTH}자 이내로 입력해주세요."

        try:
            duration_weeks = int(data.get("duration_weeks", 12))
            daily_hours = float(data.get("daily_hours", 2))
        except (TypeError, ValueError):
            return None, "duration_weeks와 daily_hours는 숫자여야 합니다."

        if not MIN_WEEKS <= duration_weeks <= MAX_WEEKS:
            return None, f"학습 기간은 {MIN_WEEKS}~{MAX_WEEKS}주 사이여야 합니다."
        if not MIN_DAILY_HOURS <= daily_hours <= MAX_DAILY_HOURS:
            return None, (
                f"하루 학습 시간은 {MIN_DAILY_HOURS}~{MAX_DAILY_HOURS}시간 사이여야 합니다."
            )

        return {
            "goal": goal,
            "category": category,
            "duration_weeks": duration_weeks,
            "daily_hours": daily_hours,
            "current_level": (data.get("current_level") or "초급").strip(),
        }, None

    @staticmethod
    @transaction.atomic
    def _persist_roadmap(user, params, roadmap_data):
        """AI 응답을 DB에 저장한다. 중간 실패 시 전체 롤백된다."""
        roadmap = Roadmap.objects.create(
            user=user,
            title=roadmap_data.get("roadmap_title") or params["goal"],
            **params,
        )

        seen_week_numbers = set()
        for index, week_data in enumerate(roadmap_data.get("weeks", []), start=1):
            # 모델이 주차 번호를 중복/누락해도 유니크 제약을 위반하지 않도록 보정
            try:
                week_number = int(week_data.get("week_number", index))
            except (TypeError, ValueError):
                week_number = index
            if week_number in seen_week_numbers:
                week_number = index
            seen_week_numbers.add(week_number)

            try:
                estimated_hours = int(week_data.get("estimated_hours", 10))
            except (TypeError, ValueError):
                estimated_hours = 10

            resources = week_data.get("resources")
            week = Week.objects.create(
                roadmap=roadmap,
                week_number=week_number,
                title=week_data.get("title", ""),
                description=week_data.get("description", ""),
                estimated_hours=estimated_hours,
                resources=resources if isinstance(resources, list) else [],
                project_suggestion=week_data.get("project_suggestion", ""),
            )

            Checklist.objects.bulk_create(
                [
                    Checklist(week=week, content=str(content)[:500])
                    for content in week_data.get("checklists", [])
                    if content
                ]
            )

        return roadmap


class WeekViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = Week.objects.all()
    serializer_class = WeekSerializer
    permission_classes = [permissions.IsAuthenticated]
    owner_lookup = "roadmap__user"


class ChecklistViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = Checklist.objects.all()
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]
    owner_lookup = "week__roadmap__user"

    @action(detail=True, methods=["post"])
    def toggle_complete(self, request, pk=None):
        checklist = self.get_object()
        checklist.is_completed = not checklist.is_completed
        checklist.completed_at = timezone.now() if checklist.is_completed else None
        checklist.save(update_fields=["is_completed", "completed_at"])
        serializer = self.get_serializer(checklist)
        return Response(serializer.data)


class ProgressViewSet(OwnedByUserMixin, viewsets.ModelViewSet):
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    owner_lookup = "roadmap__user"
