# lms/urls.py (ROOT_URLCONF = "lms.urls")
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework_simplejwt.views import TokenRefreshView
from lms_app.views import CourseMaterialUploadView
def password_reset_confirm_redirect(request, uidb64, token):
    fe = (settings.FRONTEND_URL or "http://localhost:3000").rstrip("/")
    return redirect(f"{fe}/reset-password?uid={uidb64}&token={token}")

urlpatterns = [
    path("admin/", admin.site.urls),

    # ✅ เส้น API ของแอปเรา
    path("api/", include("lms_app.urls")),

    # ✅ เส้นทางของ dj-rest-auth (ถ้าจะใช้เฉพาะบางอัน เช่น password reset ก็โอเค)
    path("api/auth/", include("dj_rest_auth.urls")),

    # JWT refresh + docs
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path('api/materials/upload/', CourseMaterialUploadView.as_view(), name='materials-upload'),

    # FE reset password redirect
    path("password-reset-confirm/<uidb64>/<token>/", password_reset_confirm_redirect,
         name="password_reset_confirm"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
