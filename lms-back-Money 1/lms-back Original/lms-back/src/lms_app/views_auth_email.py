from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from drf_spectacular.utils import extend_schema
from lms_app.serializers import (
    RegisterRequestSerializer,
    VerifyEmailRequestSerializer,
    ResendVerificationRequestSerializer,
)
from .utils.email_verification import make_verify_link
from lms_app.models import UniversityMember, RoleChoices, University
from django.db import transaction



User = get_user_model()


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=RegisterRequestSerializer,
        responses={
            201: {"type": "object", "properties": {"detail": {"type": "string"}}},
            200: {"type": "object", "properties": {"detail": {"type": "string"}}},
            400: {"type": "object", "properties": {"detail": {"type": "string"}}},
        },
    )
    def post(self, request):
        # --- read & normalize ---
        email_raw = (request.data.get("email") or "").strip()
        email = User.objects.normalize_email(email_raw).lower()
        password = request.data.get("password") or ""
        full_name = (request.data.get("full_name") or "").strip()

        requested_role_raw = (request.data.get("role") or "").strip().upper()
        requested_role = requested_role_raw if requested_role_raw in ["INSTRUCTOR", "STUDENT"] else None
        university_id = request.data.get("university_id")  # ไม่บังคับแล้ว

        if not email or not password:
            return Response({"detail": "email & password required"}, status=400)

        # --- ชั้นที่ 1: กันอีเมลซ้ำแบบปกติ (case-insensitive) ---
        existing = User.objects.filter(email__iexact=email).first()
        if existing:
            if not existing.is_active:
                # resend verification link
                try:
                    verify_link = make_verify_link(existing, settings.FRONTEND_URL)
                    subject = f"ลิงก์ยืนยันอีเมลใหม่ - {getattr(settings, 'SITE_NAME', 'LMS')}"
                    message = f"กดยืนยันอีกครั้งที่ลิงก์นี้:\n{verify_link}"
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [existing.email])
                except Exception as e:
                    print(f"[register] resend failed: {e}")
                return Response({"detail": "email already registered, verification email resent"}, status=200)
            return Response({"detail": "email already registered"}, status=400)

        # --- สร้าง user แบบ atomic + กัน race condition ---
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    full_name=full_name or email.split("@")[0],
                    is_active=False,
                )

                # 🔒 ล็อค role ไว้ที่ผู้ใช้ (ไม่บังคับผูกมหาวิทยาลัยตอนนี้)
                effective_role = requested_role or RoleChoices.STUDENT
                if getattr(user, "role", None) != effective_role:
                    user.role = effective_role
                    user.save(update_fields=["role"])

        except IntegrityError:
            # --- ชั้นที่ 2: กันกรณีกดซ้ำเร็ว ๆ แล้วชน unique constraint ---
            existing = User.objects.filter(email__iexact=email).first()
            if existing:
                if not existing.is_active:
                    try:
                        verify_link = make_verify_link(existing, settings.FRONTEND_URL)
                        subject = f"ลิงก์ยืนยันอีเมลใหม่ - {getattr(settings, 'SITE_NAME', 'LMS')}"
                        message = f"กดยืนยันอีกครั้งที่ลิงก์นี้:\n{verify_link}"
                        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [existing.email])
                    except Exception as e:
                        print(f"[register] resend failed: {e}")
                    return Response({"detail": "email already registered, verification email resent"}, status=200)
                return Response({"detail": "email already registered"}, status=400)
            return Response({"detail": "email already registered"}, status=400)

        # --- ส่งอีเมลยืนยัน ---
        try:
            verify_link = make_verify_link(user, settings.FRONTEND_URL)
            subject = f"ยืนยันอีเมลสำหรับ {getattr(settings, 'SITE_NAME', 'LMS')}"
            message = (
                f"สวัสดี {user.full_name or user.email}\n\n"
                f"กรุณายืนยันอีเมลของคุณโดยกดลิงก์ด้านล่าง:\n{verify_link}\n\n"
                f"หากคุณไม่ได้ร้องขอสมัครสมาชิก สามารถละเว้นอีเมลนี้ได้"
            )
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
            return Response({"detail": "registered, verification email sent"}, status=201)
        except Exception as e:
            print(f"[register] send_mail failed: {e}")
            return Response(
                {"detail": "registered, but email could not be sent. Please try resend."},
                status=201,
            )

        except Exception as e:
            # เผื่อ error ระหว่าง atomic block
            print(f"[register] fatal: {e}")
            return Response({"detail": "registration failed"}, status=400)


class VerifyEmailView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=VerifyEmailRequestSerializer,
        responses={200: {"type": "object", "properties": {"detail": {"type": "string"}}},
                   400: {"type": "object", "properties": {"detail": {"type": "string"}}}}
    )
    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        if not uidb64 or not token:
            return Response({"detail": "uid and token required"}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "invalid uid"}, status=400)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            if hasattr(user, "email_verified"):
                setattr(user, "email_verified", True)
            user.save()
            return Response({"detail": "email verified"})
        return Response({"detail": "invalid or expired token"}, status=400)

class ResendVerificationView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        request=ResendVerificationRequestSerializer,
        responses={200: {"type": "object", "properties": {"detail": {"type": "string"}}},
                   400: {"type": "object", "properties": {"detail": {"type": "string"}}},
                   404: {"type": "object", "properties": {"detail": {"type": "string"}}}}
    )
    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "no such email"}, status=404)

        if user.is_active:
            return Response({"detail": "already verified"}, status=400)

        verify_link = make_verify_link(user, settings.FRONTEND_URL)
        subject = f"ลิงก์ยืนยันอีเมลใหม่ - {getattr(settings, 'SITE_NAME', 'LMS')}"
        message = f"กดยืนยันอีกครั้งที่ลิงก์นี้:\n{verify_link}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        return Response({"detail": "verification link resent"})
