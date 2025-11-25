from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    InstructorMeView, InstructorProfileView, UserMeView,
    UniversityViewSet, CourseViewSet, CourseChapterViewSet,
    ReviewViewSet, UniversityMemberViewSet, MyEducationViewSet, 
    MyTeachingViewSet, ImportantDocumentReadOnlyViewSet, AdminOrganizationListViewSet,
    UniversitiesStaffOrganizationListViewSet,
)
from .views import ImportantDocumentViewSet

router = DefaultRouter()
router.register(r'universities', UniversityViewSet, basename='university')
router.register(r'courses', CourseViewSet, basename='course')

router.register(r'chapters', CourseChapterViewSet, basename='chapter')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'university-members', UniversityMemberViewSet, basename='university-member')
router.register(r'instructor/educations', MyEducationViewSet, basename='my-educations')
router.register(r'instructor/teachings',  MyTeachingViewSet, basename='my-teachings')
router.register(r'admin/documents', ImportantDocumentViewSet, basename='admin-documents')
router.register(r'documents', ImportantDocumentReadOnlyViewSet, basename='documents')
router.register(r'admin/listorganizations', AdminOrganizationListViewSet, basename='admin-listorganizations')
router.register(r'universities-staff/listorganizations',UniversitiesStaffOrganizationListViewSet,basename='universities-staff-listorganizations')
urlpatterns = [
    # ใช้ UserMeView เพราะรองรับ PATCH (อัปเดตรูป/ชื่อ) ได้
    path('auth/user/', UserMeView.as_view(), name='auth-user'),
    # bundle ของ instructor
    path('instructor/me/', InstructorMeView.as_view(), name='instructor-me'),
    path('instructor/profile/', InstructorProfileView.as_view(), name='instructor-profile'),
]

# ผนวกเส้นทางของ router แค่ครั้งเดียว
urlpatterns += router.urls
