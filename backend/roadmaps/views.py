from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
import anthropic
import os
import json

from .models import Checklist, Progress, Roadmap, Week
from .serializers import (
    ChecklistSerializer,
    ProgressSerializer,
    RoadmapSerializer,
    WeekSerializer,
)


class RoadmapViewSet(viewsets.ModelViewSet):
    serializer_class = RoadmapSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Roadmap.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Claude AI로 로드맵 자동 생성"""
        
        goal = request.data.get('goal')
        category = request.data.get('category')
        duration_weeks = request.data.get('duration_weeks', 12)
        daily_hours = request.data.get('daily_hours', 2)
        current_level = request.data.get('current_level', '초급')
        
        if not goal or not category:
            return Response(
                {'error': 'goal과 category는 필수입니다.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            API_KEY = os.getenv('ANTHROPIC_API_KEY')    
            client = anthropic.Anthropic(api_key=API_KEY)
            
            prompt = f"""당신은 학습 로드맵 전문가입니다.
다음 정보로 상세한 학습 로드맵을 JSON 형식으로 생성해주세요.

목표: {goal}
카테고리: {category}
기간: {duration_weeks}주
하루 학습 시간: {daily_hours}시간
현재 수준: {current_level}

주차별로 다음을 포함:
1. 주차 제목
2. 학습 내용 설명 (200자 이내)
3. 예상 소요 시간
4. 학습 자료 2-3개
5. 실습 프로젝트
6. 체크리스트 3개

JSON 형식으로만 출력:
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

            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            response_text = message.content[0].text
            
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0]
            else:
                json_str = response_text
            
            roadmap_data = json.loads(json_str.strip())
            
            roadmap = Roadmap.objects.create(
                user=request.user,
                title=roadmap_data.get('roadmap_title', goal),
                goal=goal,
                category=category,
                duration_weeks=duration_weeks,
                daily_hours=daily_hours,
                current_level=current_level
            )
            
            for week_data in roadmap_data.get('weeks', []):
                week = Week.objects.create(
                    roadmap=roadmap,
                    week_number=week_data.get('week_number', 1),
                    title=week_data.get('title', ''),
                    description=week_data.get('description', ''),
                    estimated_hours=week_data.get('estimated_hours', 10),
                    resources=week_data.get('resources', []),
                    project_suggestion=week_data.get('project_suggestion', '')
                )
                
                for checklist_content in week_data.get('checklists', []):
                    Checklist.objects.create(week=week, content=checklist_content)
            
            serializer = self.get_serializer(roadmap)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError as e:
            return Response(
                {'error': f'JSON 파싱 실패: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'로드맵 생성 실패: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WeekViewSet(viewsets.ModelViewSet):
    queryset = Week.objects.all()
    serializer_class = WeekSerializer
    permission_classes = [permissions.IsAuthenticated]


class ChecklistViewSet(viewsets.ModelViewSet):
    queryset = Checklist.objects.all()
    serializer_class = ChecklistSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=["post"])
    def toggle_complete(self, request, pk=None):
        checklist = self.get_object()
        checklist.is_completed = not checklist.is_completed
        checklist.completed_at = timezone.now() if checklist.is_completed else None
        checklist.save()
        serializer = self.get_serializer(checklist)
        return Response(serializer.data)


class ProgressViewSet(viewsets.ModelViewSet):
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
