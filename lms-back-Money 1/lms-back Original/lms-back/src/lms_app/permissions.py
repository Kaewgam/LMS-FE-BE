from .models import UniversityMember, RoleChoices, Course
from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsUniversityAdmin(permissions.BasePermission):
    """
    Permission to only allow admins of a university to edit it.
    """
    def has_permission(self, request, view):

        if request.user.is_superuser:
            print('SUPA USER HAS ARRIVED')
            return True
        return UniversityMember.objects.filter(
            university=request.user.university,
            user=request.user,
            role=RoleChoices.ADMIN
        ).exists()

class IsUniversityInstructor(permissions.BasePermission):

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser:
            return True

        # ผ่านถ้า role เป็น INSTRUCTOR (ไม่ต้องมีมหาลัย)
        if str(getattr(request.user, "role", "")).upper() == "INSTRUCTOR":
            return True
        
        # เดิม: ผ่านถ้าเป็นสมาชิกมหาลัยบทบาท INSTRUCTOR
        return UniversityMember.objects.filter(
            university=getattr(request.user, "university", None),
            user=request.user,
            role=RoleChoices.INSTRUCTOR
        ).exists()
    
class IsUniversityMember(permissions.BasePermission):
    """
    Permission to only allow members of a university to edit it.
    """
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return UniversityMember.objects.filter(
            university=request.user.university,
            user=request.user
        ).exists()

class IsCourseOwnerOrAdmin(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        
        if request.user.is_superuser:
            return True

        # ถ้า course ไม่มี university -> เช็คเฉพาะเจ้าของ
        if not getattr(obj, "university_id", None):
            return obj.instructor == request.user

        is_admin = UniversityMember.objects.filter(
            university=obj.university, user=request.user, role=RoleChoices.ADMIN
        ).exists()

        return is_admin or (obj.instructor == request.user)

class IsCourseOwner(permissions.BasePermission):
    """
    Custom permission to only allow the course owner (instructor) to perform actions.
    """
    def has_object_permission(self, request, view, obj):
        # obj ในที่นี้คือ CourseChapter instance
        # เราจะตรวจสอบว่าผู้ใช้ที่ request มา คือคนเดียวกับ instructor ของคอร์สนี้หรือไม่
        if request.user.is_superuser:
            return True
        return obj.course.instructor == request.user
    
class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Allows read-only access to any authenticated user.
    """
    def has_object_permission(self, request, view, obj):
        # ถ้าเป็น GET, HEAD หรือ OPTIONS ให้ผ่านไปเลย
        if request.method in permissions.SAFE_METHODS:
            return True

        # อันนี้เอาไว้เช็คสิทธิในการเป็นเจ้าของ
        return obj.student == request.user
class IsInstructorRole(permissions.BasePermission):
    """
    อนุญาตถ้า user มีบทบาทเป็น INSTRUCTOR (จาก field role หรือ group)
    """
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser:
            return True
        role = (getattr(u, "role", None) or "").upper()
        if role == "INSTRUCTOR":
            return True
        # กันไว้กรณีใช้ Django Group
        return u.groups.filter(name__iexact="instructor").exists()

class IsDocumentOwnerOrAdmin(permissions.BasePermission):
    """
    ให้เขียน/ลบได้ถ้าเป็นเจ้าของเอกสาร หรือเป็น superuser/staff
    (ใช้คู่กับ IsInstructorRole เพื่อจำกัดสิทธิ์ระดับ endpoint)
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if u.is_superuser or u.is_staff:
            return True
        return obj.uploaded_by_id == u.id

class IsCourseInstructor(BasePermission):
    """
    อนุญาตเฉพาะผู้สอนของคอร์สนั้น ๆ
    """

    def has_permission(self, request, view):
        course_id = view.kwargs.get("course_id") or request.query_params.get("course")
        if not course_id or not request.user or not request.user.is_authenticated:
            return False
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return False
        return course.instructor_id == request.user.id

class IsInstructorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            return True
        role = (getattr(u, "role", "") or "").upper()
        if role == "INSTRUCTOR":
            return True
        return u.groups.filter(name__iexact="instructor").exists()

class IsOwnerStudentOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if getattr(u, "is_staff", False):
            return True
        return obj.student_id == u.id