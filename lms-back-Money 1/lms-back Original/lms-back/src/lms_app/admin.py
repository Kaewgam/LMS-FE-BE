from .models import Course
# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    University, User, UniversityMember, InstructorInvitation,
    Quiz, QuizQuestion, QuizChoice,
    ImportantDocument, Certificate, CertificateTemplate,
    Course, Category, Curriculum,   # ← เพิ่ม import
)

# ----- University -----
@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ('name', 'email_domain', 'created_at')
    search_fields = ('name', 'email_domain')

# ----- User -----
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'role', 'university', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'groups', 'university')
    search_fields = ('email', 'full_name')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('full_name', 'university', 'phone')}),
        # ⭐ เพิ่ม section สำหรับ role
        ('Role', {'fields': ('role',)}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # ฟอร์มตอนสร้าง user ใหม่
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'university', 'role', 'password1', 'password2'),
        }),
    )

# ----- UniversityMember -----
@admin.register(UniversityMember)
class UniversityMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'university', 'role')
    list_filter = ('university', 'role')
    search_fields = ('user__email', 'university__name')
    autocomplete_fields = ['user', 'university']

# ----- InstructorInvitation -----
@admin.register(InstructorInvitation)
class InstructorInvitationAdmin(admin.ModelAdmin):
    list_display = ('email', 'university', 'invited_by', 'is_accepted')
    list_filter = ('university', 'is_accepted')
    search_fields = ('email', 'university__name')
    autocomplete_fields = ['university', 'invited_by']

# ----- ImportantDocument -----
@admin.register(ImportantDocument)
class ImportantDocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "uploaded_by", "created_at")
    search_fields = ("name", "uploaded_by__email", "uploaded_by__full_name")  # ← ลบ __username (ไม่มีในโมเดล)
    ordering = ("-created_at",)

# ----- Quiz (หมายเหตุ: Django Admin ไม่รองรับ nested inline) -----
class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 0

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("course", "title")
    inlines = [QuizQuestionInline]

# (ถ้าต้องแก้ตัวเลือกคำตอบ ให้เปิดในหน้า QuizQuestion แยกต่างหาก)
@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ("quiz", "order", "type")
    search_fields = ("quiz__course__title",)
    ordering = ("quiz", "order")

@admin.register(QuizChoice)
class QuizChoiceAdmin(admin.ModelAdmin):
    list_display = ("question", "order", "text")
    search_fields = ("question__quiz__course__title", "text")
    ordering = ("question", "order")

# ====== ใบประกาศ / เทมเพลต (แก้ไขให้ตรงกับโมเดลใหม่) ======
@admin.register(CertificateTemplate)
class CertificateTemplateAdmin(admin.ModelAdmin):
    list_display = ("course", "style", "primary_color", "secondary_color", "issuer_name", "updated_at")
    search_fields = ("course__title", "issuer_name", "course_title_override")
    list_filter = ("style",)
    readonly_fields = ("updated_at", "updated_by")
    autocomplete_fields = ("course", "updated_by")

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ("serial_no", "student", "course", "issued_at", "render_status")
    search_fields = ("serial_no", "verification_code", "student__email", "student__full_name", "course__title")
    list_filter = ("render_status",)
    readonly_fields = ("created_at", "issued_at")
    autocomplete_fields = ("student", "course", "template", "created_by")

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "instructor", "university", "status", "created_at")
    search_fields = ("title", "id", "instructor__email", "instructor__full_name", "university__name")
    list_filter = ("status", "university", "is_paid")
    autocomplete_fields = ("instructor", "university", "category", "curriculum")

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}  # ให้ slug auto จาก name

@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ("name", "university")
    search_fields = ("name", "university__name")
    autocomplete_fields = ("university",)  # optional สะดวกเวลาเลือกมหาลัย