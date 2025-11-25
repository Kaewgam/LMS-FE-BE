from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse
# และ import serializers ที่เพิ่งเพิ่ม
from .serializers import (
    UserDetailsSerializer, ChangePasswordSerializer, UserMeSerializer,
    LoginSerializer, TokenPairSerializer, LogoutSerializer,
)

User = get_user_model()

@extend_schema(
    tags=["Auth"],
    request=LoginSerializer,
    responses={
        200: TokenPairSerializer,
        400: OpenApiResponse(description="Missing email or password"),
        401: OpenApiResponse(description="Invalid credentials"),
    },
)
class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response({"detail": "Missing email or password."}, status=400)

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "Invalid credentials."}, status=401)
        if not user.is_active:
            return Response({"detail": "Inactive account."}, status=400)

        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token), "refresh": str(refresh)}, status=200)


@extend_schema(
    tags=["Auth"],
    request=LogoutSerializer,
    responses={205: OpenApiResponse(description="Logged out (refresh blacklisted)"),
               400: OpenApiResponse(description="invalid token / missing refresh")}
)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserDetailsSerializer(request.user).data)

    def patch(self, request):
        ser = UserDetailsSerializer(request.user, data=request.data, partial=True, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response({'detail': 'เปลี่ยนรหัสผ่านสำเร็จ'}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "refresh is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh)
            token.blacklist()
        except TokenError:
            return Response({"detail": "invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)