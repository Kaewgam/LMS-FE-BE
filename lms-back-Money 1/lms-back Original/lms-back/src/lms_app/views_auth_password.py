from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers

User = get_user_model()
token_gen = PasswordResetTokenGenerator()

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "รหัสผ่านไม่ตรงกัน"})
        return attrs

class ForgotPasswordView(APIView):
    permission_classes = []
    def post(self, request):
        s = ForgotPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"]

        # ไม่บอกว่าอีเมลมี/ไม่มี (security)
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            return Response({"detail": "If the email exists, a reset link will be sent."}, status=200)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_gen.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

        subject = f"[{settings.SITE_NAME}] Password reset"
        message = f"Click the link to reset your password: {reset_url}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
        return Response({"detail": "Email sent"}, status=200)

class ResetPasswordView(APIView):
    permission_classes = []
    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(s.validated_data["uid"]))
            user = User.objects.get(pk=uid, is_active=True)
        except Exception:
            return Response({"detail": "Invalid link"}, status=400)

        token = s.validated_data["token"]
        if not token_gen.check_token(user, token):
            return Response({"detail": "Invalid or expired token"}, status=400)

        user.set_password(s.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password has been reset"}, status=200)
