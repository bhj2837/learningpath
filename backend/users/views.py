from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

MAX_USERNAME_LENGTH = 150


class AuthRateThrottle(ScopedRateThrottle):
    scope = "auth"


def _user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def register(request):
    """회원가입"""
    username = (request.data.get('username') or '').strip()
    email = (request.data.get('email') or '').strip()
    password = request.data.get('password') or ''

    if not username or not password:
        return Response(
            {'error': 'username과 password는 필수입니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(username) > MAX_USERNAME_LENGTH:
        return Response(
            {'error': f'아이디는 {MAX_USERNAME_LENGTH}자 이내여야 합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # settings.AUTH_PASSWORD_VALIDATORS 규칙을 실제로 적용한다
    try:
        validate_password(password, user=User(username=username, email=email))
    except ValidationError as exc:
        return Response(
            {'error': ' '.join(exc.messages)},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
    except IntegrityError:
        # 동시 요청으로 exists() 검사를 통과해도 여기서 안전하게 처리된다
        return Response(
            {'error': '이미 사용 중인 아이디입니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {'token': token.key, 'user': _user_payload(user)},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def login_view(request):
    """로그인"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'username과 password는 필수입니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {'error': '아이디 또는 비밀번호가 올바르지 않습니다.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)

    return Response({'token': token.key, 'user': _user_payload(user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """로그아웃 — 현재 토큰을 폐기한다."""
    Token.objects.filter(user=request.user).delete()
    return Response({'message': '로그아웃 되었습니다.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """현재 사용자 프로필"""
    user = request.user
    return Response({
        **_user_payload(user),
        'roadmap_count': user.roadmaps.count(),
    })
