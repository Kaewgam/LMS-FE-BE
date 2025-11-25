from .models import UniversityMember, RoleChoices
from rest_framework import permissions

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
    """
        Permission to only allow instructor of a university to edit it.
    """
    def has_permission(self, request, view):
        if request.user.is_superuser:
            print('SUPA USER HAS ARRIVED')
            return True
        
        return UniversityMember.objects.filter(
            university=request.user.university,
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
    """
    อนุญาตให้เจ้าของคอร์ส (Instructor) หรือ Admin ของมหาวิทยาลัยแก้ไขได้
    """
    def has_object_permission(self, request, view, obj):
        # obj ในที่นี้คือ Course instance
        if request.user.is_superuser:
            return True

        is_admin = UniversityMember.objects.filter(
            university=obj.university,
            user=request.user,
            role=RoleChoices.ADMIN
        ).exists()
        
        # ตรวจสอบว่าเป็นเจ้าของคอร์ส
        is_owner = (obj.instructor == request.user)
        
        return is_admin or is_owner

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