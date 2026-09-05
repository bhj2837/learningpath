from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class ThrottleResetMixin:
    """스로틀 카운터는 캐시에 남아 테스트 간에 누적되므로 매번 비운다."""

    def setUp(self):
        cache.clear()
        super().setUp()


class RegisterTests(ThrottleResetMixin, APITestCase):
    URL = "/api/users/register/"

    def test_register_success(self):
        res = self.client.post(
            self.URL,
            {"username": "newbie", "email": "a@b.com", "password": "Str0ng!passw0rd"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", res.data)
        self.assertTrue(User.objects.filter(username="newbie").exists())

    def test_password_validators_are_enforced(self):
        """settings.AUTH_PASSWORD_VALIDATORS가 실제로 적용되어야 한다."""
        for weak in ("123456", "password", "12345678", "abc"):
            with self.subTest(password=weak):
                res = self.client.post(
                    self.URL,
                    {"username": f"u{weak}", "password": weak},
                    format="json",
                )
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertFalse(User.objects.filter(username=f"u{weak}").exists())

    def test_duplicate_username_rejected(self):
        User.objects.create_user(username="dup", password="Str0ng!passw0rd")
        res = self.client.post(
            self.URL,
            {"username": "dup", "password": "An0ther!passw0rd"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_fields_rejected(self):
        res = self.client.post(self.URL, {"username": "x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginLogoutTests(ThrottleResetMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.password = "Str0ng!passw0rd"
        self.user = User.objects.create_user(username="tester", password=self.password)

    def test_login_success(self):
        res = self.client.post(
            "/api/users/login/",
            {"username": "tester", "password": self.password},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)

    def test_login_wrong_password(self):
        res = self.client.post(
            "/api/users/login/",
            {"username": "tester", "password": "wrong-password"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_revokes_token(self):
        self.client.force_authenticate(user=self.user)
        Token.objects.get_or_create(user=self.user)

        res = self.client.post("/api/users/logout/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_logout_without_token_does_not_error(self):
        """토큰이 없는 세션 인증 상태에서도 500이 나면 안 된다."""
        self.client.force_authenticate(user=self.user)
        res = self.client.post("/api/users/logout/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class ProfileTests(ThrottleResetMixin, APITestCase):
    def test_profile_requires_auth(self):
        res = self.client.get("/api/users/profile/")
        self.assertIn(
            res.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_profile_returns_roadmap_count(self):
        user = User.objects.create_user(username="tester", password="Str0ng!passw0rd")
        self.client.force_authenticate(user=user)
        res = self.client.get("/api/users/profile/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["roadmap_count"], 0)


class HealthCheckTests(APITestCase):
    def test_healthz_is_public(self):
        """배포 헬스체크는 인증 없이 200이어야 한다."""
        res = self.client.get("/healthz/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["status"], "ok")
