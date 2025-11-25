from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_scoring import CourseScoringView
from .views import (
    UserMeView, InstructorMeView, InstructorProfileView,
    UniversityViewSet, CourseViewSet, CourseChapterViewSet, ReviewViewSet,
    UniversityMemberViewSet, MyEducationViewSet, MyTeachingViewSet,
    ImportantDocumentViewSet, ImportantDocumentReadOnlyViewSet,
    AdminOrganizationListViewSet, UniversitiesStaffOrganizationListViewSet,
    GoogleTokenLogin, CurriculumViewSet, CourseLevelChoicesAPIView,
    CategoryViewSet, InstructorDocumentViewSet, CourseMaterialViewSet,
    CourseMaterialUploadView, CourseQuizView,CertificateRenderAPIView, certificate_public_detail,
    StudentListAPIView,InstructorListAPIView,
)
from .views_auth_email import RegisterView, VerifyEmailView, ResendVerificationView
from .views_auth import LoginView, MeView, ChangePasswordView, LogoutView
from .views_certificate_issue import (
    CertificateTemplateView,      # GET/PUT template
    CertificatePreviewAPIView,    # GET preview pdf
    IssueCertificates,            # POST issue certs
    SaveTemplateAndIssue,         # POST save template + issue
)
from .views_assignment import AssignmentViewSet

router = DefaultRouter()
router.register(r"universities", UniversityViewSet, basename="university")
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"chapters", CourseChapterViewSet, basename="chapters")
router.register(r"assignments", AssignmentViewSet, basename="assignment")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"university-members", UniversityMemberViewSet, basename="university-member")
router.register(r"my/educations", MyEducationViewSet, basename="my-educations")
router.register(r"instructor/teachings", MyTeachingViewSet, basename="my-teachings")
router.register(r"admin/documents", ImportantDocumentViewSet, basename="admin-documents")
router.register(r"instructor/documents", InstructorDocumentViewSet, basename="instructor-documents")
router.register(r"documents", ImportantDocumentReadOnlyViewSet, basename="documents")
router.register(r"admin/listorganizations", AdminOrganizationListViewSet, basename="admin-listorganizations")
router.register(r"universities-staff/listorganizations", UniversitiesStaffOrganizationListViewSet, basename="universities-staff-listorganizations")
router.register(r"curricula", CurriculumViewSet, basename="curriculum")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"materials", CourseMaterialViewSet, basename="materials")

# ===== Certificate ViewSet mappings still used =====
#cert_list = CourseCertificateViewSet.as_view({"get": "list"})
#cert_template = CourseCertificateViewSet.as_view({"get": "template", "put": "template", "patch": "template"})
#cert_save_issue = CourseCertificateViewSet.as_view({"post": "save_and_issue"})

urlpatterns = [
    # Auth
    path("auth/user/", MeView.as_view(), name="rest_user_details"),
    path("auth/google/token-login/", GoogleTokenLogin.as_view(), name="google_token_login"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", UserMeView.as_view(), name="auth-me"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/password/change/", ChangePasswordView.as_view(), name="auth-password-change"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/verify/", VerifyEmailView.as_view(), name="auth-verify"),
    path("auth/resend/", ResendVerificationView.as_view(), name="auth-resend"),
    path("students/", StudentListAPIView.as_view(), name="students-list"),
    path("instructors/", InstructorListAPIView.as_view(), name="instructors-list"),

    # Course utils
    path("course-levels/", CourseLevelChoicesAPIView.as_view(), name="course-levels"),
    path("materials/upload/", CourseMaterialUploadView.as_view(), name="materials-upload"),
    path("courses/<uuid:course_id>/scoring/", CourseScoringView.as_view(), name="course-scoring"),
    path("courses/<uuid:course_id>/quiz/", CourseQuizView.as_view(), name="course-quiz"),

    # Certificates
    #path("courses/<uuid:course_id>/certificates/", cert_list, name="cert-list"),
    path("courses/<uuid:course_id>/certificates/template/", CertificateTemplateView.as_view(), name="cert-template"),
    path("courses/<uuid:course_id>/certificates/preview/",  CertificatePreviewAPIView.as_view(), name="cert-preview"),
    path("courses/<uuid:course_id>/certificates/issue/",    IssueCertificates.as_view(), name="cert-issue"),
    path("courses/<uuid:course_id>/certificates/save-and-issue/", SaveTemplateAndIssue.as_view(), name="cert-save-and-issue"),
    
    # Public/Download
    path("certificates/<uuid:pk>/public/", certificate_public_detail, name="certificate-public"),
    path("certificates/<uuid:cert_id>/download/", CertificateRenderAPIView.as_view(), name="certificate-download"),
]

urlpatterns += router.urls
