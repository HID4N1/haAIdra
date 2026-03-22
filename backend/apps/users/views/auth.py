import logging
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.users.models import User, RefreshToken
from apps.users.serializers import (
    UserSerializer, RegisterSerializer,
    UserUpdateSerializer, ChangePasswordSerializer,
)

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _store_refresh_token(user, token_str, request):
    from django.conf import settings
    from datetime import timedelta
    lifetime   = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME", timedelta(days=7))
    expires_at = timezone.now() + lifetime
    RefreshToken.objects.create(
        user=user,
        token=token_str,
        expires_at=expires_at,
        ip_address=_get_client_ip(request),
    )


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class   = RegisterSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if not (request.user.is_authenticated and request.user.is_admin):
            data["role"] = User.Role.AGENT

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = JWTRefreshToken.for_user(user)
        _store_refresh_token(user, str(refresh), request)

        return Response(
            {
                "user":          UserSerializer(user).data,
                "access_token":  str(refresh.access_token),
                "refresh_token": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        refresh = JWTRefreshToken.for_user(user)
        _store_refresh_token(user, str(refresh), request)

        logger.info("User %s logged in from %s", user.email, _get_client_ip(request))

        return Response({
            "user":          UserSerializer(user).data,
            "access_token":  str(refresh.access_token),
            "refresh_token": str(refresh),
        })


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get("refresh_token", "")
        if not token_str:
            return Response(
                {"detail": "refresh_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh    = JWTRefreshToken(token_str)
            new_access = str(refresh.access_token)
            refresh.blacklist()

            user        = User.objects.get(id=refresh["user_id"])
            new_refresh = JWTRefreshToken.for_user(user)
            _store_refresh_token(user, str(new_refresh), request)

            return Response({
                "access_token":  new_access,
                "refresh_token": str(new_refresh),
            })
        except TokenError as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token_str = request.data.get("refresh_token", "")
        if not token_str:
            return Response(
                {"detail": "refresh_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = JWTRefreshToken(token_str)
            token.blacklist()
            RefreshToken.objects.filter(
                user=request.user, token=token_str
            ).update(is_revoked=True)
        except TokenError:
            pass

        return Response({"detail": "Logged out successfully."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password", "updated_at"])
        RefreshToken.objects.filter(user=request.user).update(is_revoked=True)
        return Response({"detail": "Password updated successfully."})