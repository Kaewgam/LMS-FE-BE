# src/lms_app/views_auth_logout.py
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse
from drf_spectacular.types import OpenApiTypes 
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

class LogoutView(APIView):
    """
    Logout สำหรับ JWT:
    - รับ refresh token จาก body หรือจากคุกกี้
    - ถ้ามี token_blacklist: ทำ blacklist() ให้
    - ลบคุกกี้ JWT ที่ตั้งชื่อไว้ใน settings (ถ้ามีใช้คุกกี้)
    """
    permission_classes = [AllowAny]

    @extend_schema(
        request=None,
        responses={200: OpenApiResponse(description="Logout success")}
    )
    def post(self, request):
        # 1) เอารีเฟรชโทเคนจาก body หรือคุกกี้
        refresh_token = (
            request.data.get("refresh")
            or request.COOKIES.get(getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "refresh-auth"))
        )
        if not refresh_token:
            return Response({"detail": "Missing refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        # 2) พยายาม blacklist (ถ้ามีแอป blacklist)
        try:
            token = RefreshToken(refresh_token)
            if "rest_framework_simplejwt.token_blacklist" in settings.INSTALLED_APPS:
                token.blacklist()
        except TokenError:
            # token ใช้ไม่ได้/หมดอายุแล้ว
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        # 3) ลบคุกกี้ฝั่งเซิร์ฟเวอร์ (เผื่อคุณเก็บไว้ในคุกกี้)
        resp = Response({"detail": "Logged out."}, status=status.HTTP_200_OK)
        for name in [
            getattr(settings, "JWT_AUTH_COOKIE", "auth"),
            getattr(settings, "JWT_AUTH_REFRESH_COOKIE", "refresh-auth"),
        ]:
            resp.delete_cookie(name)

        return resp
