from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import University, User, UniversityMember, InstructorInvitation
from .models import ImportantDocument

# --- 1. สร้าง UniversityAdmin และกำหนด search_fields ---
@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    """Admin View for University"""
    list_display = ('name', 'email_domain', 'created_at')
    # กำหนดให้สามารถค้นหาจากชื่อและโดเมนได้
    search_fields = ('name', 'email_domain')


# --- 2. แก้ไข CustomUserAdmin ให้ใช้ decorator เพื่อความสอดคล้อง ---
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Custom Admin View for the User Model"""
    # model = User # บรรทัดนี้ไม่จำเป็นแล้วเมื่อใช้ decorator
    list_display = ('email', 'full_name', 'university', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups', 'university')
    search_fields = ('email', 'full_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'university', 'phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'university', 'password', 'password2'),
        }),
    )

# --- 3. เพิ่ม search_fields ให้กับ ModelAdmin ที่เหลือ ---

@admin.register(UniversityMember)
class UniversityMemberAdmin(admin.ModelAdmin):
    """Admin View for UniversityMember"""
    list_display = ('user', 'university', 'role')
    list_filter = ('university', 'role')
    # เพิ่ม search_fields ที่นี่
    search_fields = ('user__email', 'university__name')
    autocomplete_fields = ['user', 'university']


@admin.register(InstructorInvitation)
class InstructorInvitationAdmin(admin.ModelAdmin):
    """Admin View for InstructorInvitation"""
    list_display = ('email', 'university', 'invited_by', 'is_accepted')
    list_filter = ('university', 'is_accepted')
    # เพิ่ม search_fields ที่นี่
    search_fields = ('email', 'university__name')
    autocomplete_fields = ['university', 'invited_by']

@admin.register(ImportantDocument)
class ImportantDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "uploaded_by", "created_at")
    search_fields = ("name", "uploaded_by__email", "uploaded_by__username")
    ordering = ("-created_at",)