
from django.contrib import admin

from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from lms_app.views import GoogleTokenLogin, MeView  # ✅ เปลี่ยนเป็น GoogleTokenLogin
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from lms_app.views_auth_email import RegisterView, VerifyEmailView, ResendVerificationView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [

    path('admin/', admin.site.urls),

    path('accounts/', include('allauth.urls')),  # คงไว้ได้ ไม่มีผลกับ token flow

    path('api/auth/user/', MeView.as_view(), name='rest_user_details'),
    path('api/', include('lms_app.urls')),


    path('api/auth/', include('dj_rest_auth.urls')),

    # ✅ endpoint ใหม่สำหรับ token flow
    path('api/auth/google/token-login/', GoogleTokenLogin.as_view(), name='google_token_login'),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # (ถ้าไม่ได้ใช้ code flow แล้ว ให้ลบบรรทัดเก่าออกเลย)
    # path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),

    # swagger
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path('api/auth/register/', RegisterView.as_view(), name='auth-register'),
    path('api/auth/verify/',   VerifyEmailView.as_view(), name='auth-verify'),
    path('api/auth/resend/',   ResendVerificationView.as_view(), name='auth-resend'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
