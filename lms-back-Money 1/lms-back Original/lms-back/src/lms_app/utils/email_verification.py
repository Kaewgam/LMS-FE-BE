from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator

def make_verify_link(user, frontend_base: str):
    """
    สร้างลิงก์ยืนยันอีเมลไปหน้า Frontend:
    {frontend_base}/auth/verify?uid=...&token=...
    """
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{frontend_base}/auth/verify?uid={uidb64}&token={token}"
