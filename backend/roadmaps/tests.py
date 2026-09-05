from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Checklist, Progress, Roadmap, Week


class RoadmapTestMixin:
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="Owner!pass123")
        self.other = User.objects.create_user(username="other", password="Other!pass123")

        self.roadmap = Roadmap.objects.create(
            user=self.owner,
            title="React 배우기",
            goal="React 배우기",
            category="개발",
            duration_weeks=4,
            daily_hours=2,
            current_level="초급",
        )
        self.week = Week.objects.create(
            roadmap=self.roadmap,
            week_number=1,
            title="1주차",
            description="설명",
            estimated_hours=10,
        )
        self.checklist = Checklist.objects.create(week=self.week, content="항목1")
        self.progress = Progress.objects.create(
            roadmap=self.roadmap, date="2026-01-01", hours_studied=2
        )

    def auth(self, user):
        self.client.force_authenticate(user=user)


class OwnershipIsolationTests(RoadmapTestMixin, APITestCase):
    """다른 사용자의 데이터에 접근할 수 없어야 한다 (IDOR 회귀 방지)."""

    def test_other_user_cannot_list_roadmaps(self):
        self.auth(self.other)
        res = self.client.get("/api/roadmaps/roadmaps/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_other_user_cannot_retrieve_roadmap(self):
        self.auth(self.other)
        res = self.client.get(f"/api/roadmaps/roadmaps/{self.roadmap.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_other_user_cannot_retrieve_week(self):
        self.auth(self.other)
        res = self.client.get(f"/api/roadmaps/weeks/{self.week.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_other_user_cannot_delete_week(self):
        self.auth(self.other)
        res = self.client.delete(f"/api/roadmaps/weeks/{self.week.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Week.objects.filter(id=self.week.id).exists())

    def test_other_user_cannot_toggle_checklist(self):
        self.auth(self.other)
        res = self.client.post(
            f"/api/roadmaps/checklists/{self.checklist.id}/toggle_complete/"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.checklist.refresh_from_db()
        self.assertFalse(self.checklist.is_completed)

    def test_other_user_cannot_list_progress(self):
        self.auth(self.other)
        res = self.client.get("/api/roadmaps/progress/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 0)

    def test_cannot_attach_week_to_foreign_roadmap(self):
        """FK로 남의 로드맵을 지정하는 쓰기 요청은 거부되어야 한다."""
        self.auth(self.other)
        res = self.client.post(
            "/api/roadmaps/weeks/",
            {
                "roadmap": self.roadmap.id,
                "week_number": 99,
                "title": "침입",
                "description": "설명",
                "estimated_hours": 1,
                "resources": [],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Week.objects.filter(week_number=99).exists())

    def test_owner_can_toggle_checklist(self):
        self.auth(self.owner)
        res = self.client.post(
            f"/api/roadmaps/checklists/{self.checklist.id}/toggle_complete/"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.checklist.refresh_from_db()
        self.assertTrue(self.checklist.is_completed)
        self.assertIsNotNone(self.checklist.completed_at)

    def test_anonymous_is_rejected(self):
        res = self.client.get("/api/roadmaps/roadmaps/")
        self.assertIn(
            res.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )


class GenerateInputValidationTests(RoadmapTestMixin, APITestCase):
    """AI를 호출하기 전에 입력이 검증되어야 한다 (비용 남용 방지)."""

    URL = "/api/roadmaps/roadmaps/generate/"

    def setUp(self):
        super().setUp()
        self.auth(self.owner)

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_missing_goal_does_not_call_api(self, mock_client):
        res = self.client.post(self.URL, {"category": "개발"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        mock_client.assert_not_called()

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_excessive_duration_is_rejected(self, mock_client):
        res = self.client.post(
            self.URL,
            {"goal": "React", "category": "개발", "duration_weeks": 9999},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        mock_client.assert_not_called()

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_overlong_goal_is_rejected(self, mock_client):
        res = self.client.post(
            self.URL,
            {"goal": "가" * 501, "category": "개발"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        mock_client.assert_not_called()

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_non_numeric_duration_is_rejected(self, mock_client):
        res = self.client.post(
            self.URL,
            {"goal": "React", "category": "개발", "duration_weeks": "네주"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        mock_client.assert_not_called()


@override_settings(ANTHROPIC_API_KEY="test-key-not-real")
class GeneratePersistenceTests(RoadmapTestMixin, APITestCase):
    URL = "/api/roadmaps/roadmaps/generate/"

    def setUp(self):
        super().setUp()
        self.auth(self.owner)

    @staticmethod
    def _fake_message(text):
        class Block:
            def __init__(self, t):
                self.text = t

        class Message:
            def __init__(self, t):
                self.content = [Block(t)]

        return Message(text)

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_duplicate_week_numbers_do_not_break_unique_constraint(self, mock_anthropic):
        """모델이 주차 번호를 중복 반환해도 저장이 실패하지 않아야 한다."""
        payload = """```json
        {"roadmap_title": "테스트 로드맵",
         "weeks": [
           {"week_number": 1, "title": "A", "description": "d", "estimated_hours": 5,
            "resources": [], "project_suggestion": "p", "checklists": ["c1", "c2"]},
           {"week_number": 1, "title": "B", "description": "d", "estimated_hours": 5,
            "resources": [], "project_suggestion": "p", "checklists": ["c3"]}
         ]}
        ```"""
        mock_anthropic.return_value.messages.create.return_value = self._fake_message(payload)

        res = self.client.post(
            self.URL,
            {"goal": "테스트", "category": "개발", "duration_weeks": 2, "daily_hours": 2},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created = Roadmap.objects.get(id=res.data["id"])
        self.assertEqual(created.user, self.owner)
        self.assertEqual(created.weeks.count(), 2)
        self.assertEqual(sorted(w.week_number for w in created.weeks.all()), [1, 2])
        self.assertEqual(Checklist.objects.filter(week__roadmap=created).count(), 3)

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_malformed_json_returns_502_and_saves_nothing(self, mock_anthropic):
        mock_anthropic.return_value.messages.create.return_value = self._fake_message(
            "죄송합니다, 생성할 수 없습니다."
        )
        before = Roadmap.objects.count()

        res = self.client.post(
            self.URL,
            {"goal": "테스트", "category": "개발", "duration_weeks": 2},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(Roadmap.objects.count(), before)

    @patch("roadmaps.views.anthropic.Anthropic")
    def test_error_response_does_not_leak_internals(self, mock_anthropic):
        mock_anthropic.return_value.messages.create.side_effect = RuntimeError(
            "api_key=sk-ant-super-secret"
        )

        res = self.client.post(
            self.URL,
            {"goal": "테스트", "category": "개발", "duration_weeks": 2},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertNotIn("sk-ant", str(res.data))

    @override_settings(ANTHROPIC_API_KEY=None)
    @patch("roadmaps.views.anthropic.Anthropic")
    def test_missing_api_key_returns_503(self, mock_anthropic):
        res = self.client.post(
            self.URL,
            {"goal": "테스트", "category": "개발", "duration_weeks": 2},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        mock_anthropic.assert_not_called()
