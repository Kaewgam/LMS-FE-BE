from rest_framework import serializers
from pathlib import Path
from urllib.parse import unquote
import unicodedata
from .models import (
    Education, TeachingExperience, ImportantDocument,
    UniversityMember, RoleChoices, University, Course,
    Enrollment, EnrollmentStatus, Review, CourseChapter,
    CourseStatus, Test, Submission, Certificate,
    CourseProgression, Notification, File, Assignment, AssignmentSubmission,
    CoursePricing, InstructorInvitation, Curriculum, InstructorProfile,
    Complaint, Category, CourseMaterial, Scoring, ScoringItem,
    Quiz, QuizQuestion, QuizChoice, CertificateTemplate,AssignmentAttachment,
)

from django.db import transaction, IntegrityError
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from typing import Optional
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from django.core.validators import RegexValidator
from django.db.models import Q

User = get_user_model()


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for the User Management page."""
    university_name = serializers.CharField(source='university.name', read_only=True, default=None)
    university_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email',
            'university_name', 'university_role',
            'is_staff', 'is_active', 'date_joined'
        ]

    def get_university_role(self, obj):
        try:
            if obj.university:
                member = UniversityMember.objects.get(user=obj, university=obj.university)
                return member.get_role_display()
        except UniversityMember.DoesNotExist:
            return "ยังไม่ได้กำหนด"
        return "ไม่มีสังกัด"


class UserDetailsSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)
    university_id = serializers.UUIDField(read_only=True, allow_null=True)
    university_name = serializers.SerializerMethodField()
    profile_image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'bio', 'is_staff',
            'profile_image_url', 'profile_image',
            'role', 'is_active', 'university_id', 'university_name'
        ]
        read_only_fields = ['email', 'is_staff', 'is_active']
        ref_name = "AppUserDetails"

    @extend_schema_field(OpenApiTypes.STR)
    def get_university_name(self, obj) -> Optional[str]:
        return obj.university.name if getattr(obj, "university_id", None) else None

    def update(self, instance, validated_data):
        img = validated_data.pop('profile_image', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if img is not None:
            instance.profile_image.save(img.name, img, save=False)
            instance.profile_image_url = instance.profile_image.url
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user
        if not check_password(attrs['current_password'], user.password):
            raise serializers.ValidationError({'current_password': 'รหัสผ่านเดิมไม่ถูกต้อง'})
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'รหัสผ่านใหม่ไม่ตรงกัน'})
        validate_password(attrs['new_password'], user)
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class UserMeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()
    is_instructor = serializers.SerializerMethodField()
    is_student = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "pk", "email", "full_name",
            "role", "role_name",
            "is_instructor", "is_student",
            "is_staff", "is_superuser",
            "groups", "profile_image_url",
        )

    def get_role(self, obj):
        return getattr(obj, "role", None)

    def get_role_name(self, obj):
        if hasattr(obj, "get_role_display"):
            try:
                return obj.get_role_display()
            except Exception:
                pass
        v = getattr(obj, "role", None)
        return str(v) if v is not None else None

    def get_is_instructor(self, obj):
        by_flag = any(getattr(obj, a, False) for a in ("is_instructor", "is_teacher"))
        by_group = obj.groups.filter(Q(name__iexact="instructor") | Q(name__iexact="teacher")).exists()
        by_name = (self.get_role_name(obj) or "").upper() in {"INSTRUCTOR", "TEACHER"}
        return by_flag or by_group or by_name

    def get_is_student(self, obj):
        by_flag = getattr(obj, "is_student", False)
        by_group = obj.groups.filter(name__iexact="student").exists()
        by_name = (self.get_role_name(obj) or "").upper() == "STUDENT"
        return by_flag or by_group or by_name

    def get_groups(self, obj):
        return list(obj.groups.values_list("name", flat=True))

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        request = self.context.get("request")
        url = obj.profile_image.url
        return request.build_absolute_uri(url) if request else url


class EducationSerializer(serializers.ModelSerializer):
    start_year = serializers.IntegerField(min_value=1900)
    end_year = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Education
        fields = ['id', 'level', 'university', 'start_year', 'end_year']
        read_only_fields = ['id']

    def validate(self, attrs):
        start = attrs.get('start_year', getattr(self.instance, 'start_year', None))
        end = attrs.get('end_year', getattr(self.instance, 'end_year', None))
        if end is not None and start is not None and end < start:
            raise serializers.ValidationError({'end_year': 'ต้องไม่ก่อน start_year'})
        return attrs


class TeachingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingExperience
        fields = ("id", "topic", "description", "start_year", "end_year")
        read_only_fields = ("id",)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class BasicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name']


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ('id', 'name', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        admin_email = self.initial_data.get('admin_email')
        university = University.objects.create(**validated_data)
        if admin_email:
            try:
                admin_user = User.objects.get(email__iexact=admin_email)
                UniversityMember.objects.get_or_create(
                    user=admin_user, university=university,
                    defaults={'role': RoleChoices.ADMIN}
                )
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    f"Admin user with email '{admin_email}' not found for new university '{university.name}'"
                )
        return university


class InstructorInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstructorInvitation
        fields = ['id', 'email', 'university', 'invited_by', 'invited_at', 'is_accepted']
        read_only_fields = ['id', 'university', 'invited_by', 'invited_at', 'is_accepted']

    def validate_email(self, value):
        university = self.context.get('university')
        domain = university.email_domain
        if not domain:
            raise serializers.ValidationError("This university does not have an email domain.")
        if not value.endswith(domain):
            raise serializers.ValidationError("This email is not in the correct domain.")

        try:
            user_id = User.objects.get(email__iexact=value).id
        except User.DoesNotExist:
            raise serializers.ValidationError("No user with this email was found.")
        if InstructorInvitation.objects.filter(email__iexact=value, university=university).exists():
            raise serializers.ValidationError("This email has already been invited to this university.")
        elif UniversityMember.objects.filter(user_id=user_id, university=university, role=RoleChoices.ADMIN).exists():
            raise serializers.ValidationError("This email is a admin of this university.")
        elif UniversityMember.objects.filter(user_id=user_id, university=university, role=RoleChoices.INSTRUCTOR).exists():
            raise serializers.ValidationError("This email is already a instructor of this university.")
        return value


class CurriculumSerializer(serializers.ModelSerializer):
    """Serializer for Curriculum."""
    class Meta:
        model = Curriculum
        fields = ['id', 'name', 'university']
        read_only_fields = ['id', 'university']


class UniversityMemberSerializer(serializers.ModelSerializer):
    """Serializer for listing and managing university members."""
    user_details = UserDetailsSerializer(source='user', read_only=True)

    class Meta:
        model = UniversityMember
        fields = ['id', 'user', 'role', 'user_details']



class CourseChapterSerializer(serializers.ModelSerializer):
    # URL ของไฟล์รูป
    cover_image_url = serializers.SerializerMethodField()
    # course เป็น FK
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    # ✅ กัน error content required (ไม่บังคับให้กรอก)
    content = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    # ✅ รองรับทั้ง order และ position (BE ใช้ position / FE ใช้ order)
    order = serializers.IntegerField(source="position", required=False)

    class Meta:
        model = CourseChapter
        fields = [
            "id",
            "course",
            "title",
            "description",
            "content",
            "position",       # field จริงใน DB
            "order",          # alias ใช้กับ FE
            "cover_image",
            "cover_image_url",
        ]
        read_only_fields = ["position"]

    def get_cover_image_url(self, obj):
        request = self.context.get("request")
        if obj.cover_image and hasattr(obj.cover_image, "url"):
            url = obj.cover_image.url
            return request.build_absolute_uri(url) if request else url
        return None


# serializers.py
class CourseMaterialSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    filename = serializers.SerializerMethodField()
    # ถ้าอยากให้ FE เก่าที่เรียกใช้ "kind" ยังอ่านได้อยู่ (ไม่บังคับ)
    kind = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CourseMaterial
        # ✅ ใช้ 'type' ให้ตรงกับ model และเสริม 'path' เผื่อคุณอยากเห็นค่าเดิมด้วย
        fields = [
            "id", "chapter",
            "type", "kind",        # <-- type คือของจริง, kind เฉยๆไว้ให้ FE
            "file", "path",
            "file_url", "filename",
            "created_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        url = obj.file.url if obj.file else None
        return request.build_absolute_uri(url) if (request and url) else url

    def get_filename(self, obj):
        return (obj.file.name.split("/")[-1]) if obj.file else ""

    def get_kind(self, obj):
        # ให้ค่า same-as type ไว้เพื่อ backward compatibility
        return getattr(obj, "type", None)



class CourseSerializer(serializers.ModelSerializer):
    banner_img = serializers.ImageField(use_url=True, required=False, allow_null=True)
    instructor_name  = serializers.CharField(source='instructor.full_name', read_only=True)
    curriculum_name  = serializers.CharField(source='curriculum.name', read_only=True)

    # ✅ ใช้สำหรับ "อ่าน": ส่งค่า pk ของ category ออกมาเหมือน curriculum
    category = serializers.UUIDField(source='category.id', read_only=True)

    # ✅ ใช้สำหรับ "เขียน": อัปเดต/สร้างด้วย category_id
    category_id = serializers.PrimaryKeyRelatedField(
        source='category',
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
        # สำคัญ: ไม่ตั้ง write_only=True เพื่อให้ GET ก็เห็นค่าได้หากต้องการ
    )
    category_name = serializers.CharField(source='category.name', read_only=True)

    # (ถ้ายังไม่มี) ช่วยให้ FE อ่าน id ของ curriculum ได้ชัดเจนขึ้น
    curriculum_id = serializers.UUIDField(source='curriculum.id', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'banner_img', 'level',
            'curriculum', 'curriculum_id',
            'instructor', 'university', 'status',
            'enroll_token', 'meeting_link',
            'created_at', 'updated_at',

            # 👇 ส่งชื่อ/ค่า id ของ category กลับไปให้ครบ
            'category', 'category_id', 'category_name',

            'instructor_name', 'curriculum_name',
            "duration_hours",
        ]
        read_only_fields = ['id','instructor','university','status','created_at','updated_at']
        extra_kwargs = {'curriculum': {'required': False, 'allow_null': True}}

    def validate_curriculum(self, value):
        if value is None:
            return None
        request = self.context.get('request')
        user_university = getattr(getattr(request, 'user', None), 'university', None)
        if user_university and value.university and value.university != user_university:
            raise serializers.ValidationError("The selected curriculum does not belong to your university.")
        return value


class CourseUpdateSerializer(serializers.ModelSerializer):
    curriculum_id = serializers.PrimaryKeyRelatedField(
        source='curriculum', queryset=Curriculum.objects.all(),
        required=False, allow_null=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        source='category', queryset=Category.objects.all(),
        required=False, allow_null=True
    )

    class Meta:
        model = Course
        fields = ['title','description','banner_img','level','curriculum_id','category_id','enroll_token','meeting_link']
        extra_kwargs = {'level': {'required': False}}

    def validate_enroll_token(self, v):
        if v in (None, ''):
            return v
        if not isinstance(v, str) or len(v) != 6 or not v.isdigit():
            raise serializers.ValidationError('รหัสคอร์สต้องเป็นตัวเลข 6 หลัก')
        return v  # ✅ อนุญาตซ้ำได้
    def validate_title(self, value):
        if value in (None, ""):
            return value
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        norm = _norm_title(value)

        qs = Course.objects.all()
        if getattr(user, 'university', None):
            qs = qs.filter(university=user.university)

        # exclude คอร์สตัวเองเวลาแก้ไข
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.filter(title__iexact=norm).exists():
            raise serializers.ValidationError("มีชื่อคอร์สนี้อยู่แล้ว กรุณาใช้ชื่ออื่น")

        return norm


class CourseStatusUpdateSerializer(serializers.ModelSerializer):
    """
    ใช้สำหรับอัปเดตสถานะคอร์สผ่าน endpoint /courses/<id>/update-status/

    - ยอมรับค่า status ได้ทั้งตัวเล็ก / ตัวใหญ่ เช่น "ACTIVE", "active"
    - บังคับไม่ให้เปลี่ยนกลับไปเป็น pending
    """
    status = serializers.CharField()

    class Meta:
        model = Course
        fields = ["status"]

    def validate_status(self, value):
        raw = (value or "").strip()
        if not raw:
            raise serializers.ValidationError("Status is required.")

        norm = raw.lower()  # แปลงให้เป็นตัวเล็ก เพื่อให้ตรงกับค่าใน CourseStatus

        # กันไม่ให้เปลี่ยนกลับไปเป็น pending
        if norm == CourseStatus.PENDING:
            raise serializers.ValidationError(
                "You cannot change the status of a course to pending."
            )

        # ตรวจว่าค่านี้อยู่ใน choices จริงหรือเปล่า
        allowed = {choice for choice, _ in CourseStatus.choices}
        if norm not in allowed:
            raise serializers.ValidationError(f"Invalid status: {raw}")

        # คืนค่าแบบตัวเล็กไปเซฟใน model
        return norm


class UniversityMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityMember
        fields = ['id', 'role']
        read_only_fields = ['id']


# -------- Enrollment & Course Members --------
class EnrollmentSerializer(serializers.ModelSerializer):
    """
    ใช้สำหรับกรณีนักเรียนลงทะเบียนเอง ผ่าน enroll_token
    """
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    enroll_token = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Enrollment
        fields = ["id", "student", "course", "status", "enrolled_at", "enroll_token"]
        read_only_fields = ["id", "student", "course", "status", "enrolled_at"]

    def validate(self, value):
        request = self.context.get("request")
        student = request.user
        course = self.context.get("course")
        enroll_token = value.get("enroll_token")

        if not course:
            raise serializers.ValidationError("Course is required.")
        if not enroll_token:
            raise serializers.ValidationError("Enroll token is required.")

        # กันลงซ้ำคอร์ส
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("You are already enrolled in this course.")

        # เช็ค token จากตัว course
        if enroll_token != course.enroll_token:
            raise serializers.ValidationError("Invalid enroll token.")
        return value

    def create(self, validated_data):
        return Enrollment.objects.create(
            student=self.context["request"].user,
            course=self.context["course"],
            status=EnrollmentStatus.ENROLLED,
        )


class CourseMemberCreateSerializer(serializers.Serializer):
    """
    ใช้สำหรับให้ Staff/แอดมินเพิ่มผู้เรียนเข้าคอร์สจากหน้า edit-course
    ไม่ใช้ enroll_token
    """
    student_id = serializers.UUIDField(write_only=True)

    def validate(self, attrs):
        course = self.context.get("course")
        student_id = attrs.get("student_id")

        if not course:
            raise serializers.ValidationError("Course context is required.")

        # กันลงซ้ำ
        if Enrollment.objects.filter(student_id=student_id, course=course).exists():
            raise serializers.ValidationError("ผู้เรียนคนนี้อยู่ในคอร์สนี้แล้ว")

        return attrs

    def create(self, validated_data):
        course = self.context["course"]
        student_id = validated_data["student_id"]

        enrollment = Enrollment.objects.create(
            student_id=student_id,
            course=course,
            status=EnrollmentStatus.ENROLLED,
        )
        return enrollment


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for the Review model."""
    student = BasicUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'student', 'course', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'student', 'created_at']

    def validate(self, data):
        course = data.get('course')
        request = self.context.get('request')
        user = request.user

        if not Enrollment.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError("You must be enrolled in this course to leave a review.")
        if Review.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError("You have already reviewed this course.")
        return data


class TestSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Test
        fields = '__all__'


class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    test = TestSerializer(read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'


class ChapterReorderSerializer(serializers.Serializer):
    """For chapter reordering endpoint."""
    ordered_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="A list of chapter UUIDs in the new desired order."
    )

    def validate_ordered_ids(self, value):
        if not value:
            raise serializers.ValidationError("This list cannot be empty.")
        return value

class CourseProgressionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)
    chapter = CourseChapterSerializer(read_only=True)

    class Meta:
        model = CourseProgression
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'


class FileSerializer(serializers.ModelSerializer):
    uploader = UserSerializer(read_only=True)
    curriculum = CurriculumSerializer(read_only=True)
    university = UniversitySerializer(read_only=True)

    class Meta:
        model = File
        fields = '__all__'


class AssignmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    instructor = UserSerializer(read_only=True)

    class Meta:
        model = Assignment
        fields = '__all__'


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment = AssignmentSerializer(read_only=True)
    student = UserSerializer(read_only=True)
    graded_by = UserSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'


class CoursePricingSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)

    class Meta:
        model = CoursePricing
        fields = '__all__'


class ImportantDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True, required=False, allow_null=True)
    document = serializers.FileField(write_only=True, required=False, allow_null=True)
    title = serializers.CharField(write_only=True, required=False, allow_blank=True)

    fileName = serializers.SerializerMethodField()
    fileUrl = serializers.SerializerMethodField()

    class Meta:
        model = ImportantDocument
        fields = ["id", "name", "title", "fileName", "fileUrl", "created_at", "file", "document"]

    @extend_schema_field(OpenApiTypes.STR)
    def get_fileName(self, obj) -> str:
        name = getattr(obj, "original_filename", "") \
               or (Path(obj.file.name).name if getattr(obj, "file", None) else "")
        return unicodedata.normalize("NFC", unquote(name))

    @extend_schema_field(OpenApiTypes.STR)
    def get_fileUrl(self, obj) -> Optional[str]:
        if not getattr(obj, "file", None):
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def validate(self, attrs):
        if not attrs.get("name") and attrs.get("title"):
            attrs["name"] = attrs.pop("title")
        if not attrs.get("file") and attrs.get("document"):
            attrs["file"] = attrs.pop("document")
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        uploaded = validated_data.get("file")
        return ImportantDocument.objects.create(
            uploaded_by=getattr(request, "user", None),
            original_filename=(uploaded.name if uploaded else ""),
            **validated_data
        )

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class RegisterRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["STUDENT", "INSTRUCTOR", "UNIVERSITY", "ADMIN"],required=False,)
    university_id = serializers.UUIDField(required=False, allow_null=True)
    


class VerifyEmailRequestSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()


class ResendVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "รหัสผ่านไม่ตรงกัน"})
        validate_password(attrs["new_password"])
        return attrs


class GoogleTokenLoginSerializer(serializers.Serializer):
    access_token = serializers.CharField(write_only=True, trim_whitespace=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"

def _norm_title(s: str) -> str:
    # trim และบีบช่องว่างหลายตัวให้เหลือตัวเดียว
    return " ".join((s or "").strip().split())

class CourseCreateSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )
    enroll_token = serializers.CharField(
        max_length=6,
        required=False,
        allow_blank=True,
        allow_null=True,
        validators=[RegexValidator(r"^\d{6}$", "รหัสคอร์สต้องเป็นตัวเลข 6 หลัก")],
    )

    # 👇 ฟิลด์ใหม่ ใช้เฉพาะตอน "ผู้ดูแล" สร้างคอร์สให้ผู้สอน
    instructor_id = serializers.UUIDField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text="UUID ของผู้สอนที่ต้องการให้เป็นเจ้าของคอร์ส (ใช้เฉพาะ Admin)",
    )

    class Meta:
        model = Course
        fields = [
            "title",
            "description",
            "banner_img",
            "level",
            "curriculum",
            "enroll_token",
            "meeting_link",
            "category",
            "instructor_id",  # 👈 เพิ่มฟิลด์นี้เข้าไปด้วย
        ]
        extra_kwargs = {"curriculum": {"required": False, "allow_null": True}}

    def validate_title(self, value):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        norm = " ".join((value or "").split())
        if not norm:
            raise serializers.ValidationError("กรุณากรอกชื่อคอร์ส")

        if not user or not getattr(user, "university_id", None):
            return norm

        qs = Course.objects.filter(university=user.university)

        if qs.filter(title__iexact=norm).exists():
            raise serializers.ValidationError("มีชื่อคอร์สนี้อยู่แล้ว กรุณาใช้ชื่ออื่น")

        return norm

    def create(self, validated_data):
        """
        กฎ:
        - ถ้าเป็นผู้สอน (INSTRUCTOR) → ใช้ตัวเองเป็น instructor เหมือนเดิม
        - ถ้าเป็นผู้ดูแล (ADMIN / UNIVERSITY ADMIN) และส่ง instructor_id มา
          → สร้างคอร์สให้ผู้สอนคนนั้น
        """
        request = self.context["request"]
        user = request.user
        instructor_id = validated_data.pop("instructor_id", None)

        # ---------- เคสผู้ดูแลกำหนดผู้สอนเอง ----------
        if instructor_id is not None:
            # อนุญาตทั้ง role ADMIN และ UNIVERSITY (ถ้าคุณมี RoleChoices.UNIVERSITY)
            role = getattr(user, "role", None)
            if role not in (RoleChoices.ADMIN, RoleChoices.UNIVERSITY):
                raise serializers.ValidationError(
                    {"instructor_id": "อนุญาตเฉพาะผู้ดูแลสถาบันเท่านั้นที่กำหนดผู้สอนได้"}
                )

            try:
                instructor = User.objects.get(pk=instructor_id)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"instructor_id": "ไม่พบผู้สอนที่เลือก"}
                )

            # ต้องอยู่มหาวิทยาลัยเดียวกัน
            if getattr(instructor, "university_id", None) != getattr(
                user, "university_id", None
            ):
                raise serializers.ValidationError(
                    {"instructor_id": "ผู้สอนต้องอยู่ในมหาวิทยาลัยเดียวกับผู้ดูแล"}
                )

            validated_data["instructor"] = instructor
            if getattr(instructor, "university", None):
                validated_data["university"] = instructor.university

        # ---------- เคสผู้สอนสร้างคอร์สเอง ----------
        else:
            validated_data["instructor"] = user
            if getattr(user, "university", None):
                validated_data["university"] = user.university

        # สถานะเริ่มต้นเป็น PENDING
        validated_data.setdefault("status", CourseStatus.PENDING)
        return super().create(validated_data)
    
class CourseMaterialUploadSerializer(serializers.Serializer):
    chapter = serializers.UUIDField()
    # รับได้ทั้ง "type" และ "kind" จาก FE แล้ว normalize เป็น lower()
    type = serializers.CharField(required=False, allow_blank=True)
    kind = serializers.CharField(required=False, allow_blank=True)
    file = serializers.FileField()
    title = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        raw = (attrs.get("type") or attrs.get("kind") or "").strip()
        if not raw:
            raise serializers.ValidationError({"type": "This field is required."})
        val = raw.lower()
        if val not in {"video", "document"}:
            raise serializers.ValidationError({"type": f"Invalid type: {raw}"})
        attrs["kind"] = val
        attrs.pop("type", None)  # กันซ้ำ
        return attrs

    def create(self, validated_data):
        # ตัวเลือก A: เก็บไฟล์ลง FileField ('file') แล้ว sync 'path' ตามชื่อไฟล์
        chapter_id = validated_data["chapter"]
        kind = validated_data["kind"]          # "video" | "document"
        upfile = validated_data["file"]
        title = validated_data.get("title") or upfile.name

        obj = CourseMaterial.objects.create(
            chapter_id=chapter_id,
            title=title,
            type=kind,      # ← ฟิลด์จริงในโมเดล
            file=upfile,    # ← Django จะอัปโหลดเข้า MEDIA_ROOT ให้เอง
        )
        # เก็บ path ไว้ด้วย (ถ้าต้องการใช้งาน)
        obj.path = obj.file.name               # หรือ obj.file.path หากอยากได้ full path
        obj.save(update_fields=["path"])
        return obj

class ScoringItemSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = ScoringItem
        fields = ["id", "description", "correct", "incorrect", "score", "order"]

    def validate(self, attrs):
        for k in ("correct", "incorrect", "score", "order"):
            v = attrs.get(k)
            if v is not None and int(v) < 0:
                raise serializers.ValidationError({k: "ต้องเป็นค่าบวกหรือศูนย์"})
        return attrs


class ScoringSerializer(serializers.ModelSerializer):
    items = ScoringItemSerializer(many=True, required=False)  # <— สำคัญ: allow PATCH ไม่ส่ง items

    class Meta:
        model = Scoring
        fields = ["id", "course", "pass_score", "items"]
        read_only_fields = ["id", "course"]

    # สร้างครั้งแรก (จำเป็นสำหรับ nested write)
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        course = self.context["course"]
        with transaction.atomic():
            scoring = Scoring.objects.create(course=course, **validated_data)
            for idx, item in enumerate(items_data):
                ScoringItem.objects.create(
                    scoring=scoring,
                    order=item.get("order", idx + 1),
                    description=item.get("description", "") or "",
                    correct=item.get("correct", 0) or 0,
                    incorrect=item.get("incorrect", 0) or 0,
                    score=item.get("score", 0) or 0,
                )
        return scoring

    # อัปเดต: ซิงก์ items เฉพาะเมื่อมี key 'items' จริง ๆ
    def update(self, instance, validated_data):
        items_provided = "items" in getattr(self, "initial_data", {})
        items_data = validated_data.pop("items", None)

        with transaction.atomic():
            instance.pass_score = validated_data.get("pass_score", instance.pass_score)
            instance.save(update_fields=["pass_score"])

            if items_provided and items_data is not None:
                keep_ids = []
                for idx, item in enumerate(items_data):
                    desired_order = item.get("order", idx + 1)
                    item_id = item.get("id")
                    if item_id:
                        try:
                            obj = instance.items.get(id=item_id)
                        except ScoringItem.DoesNotExist:
                            obj = instance.items.model(scoring=instance)
                    else:
                        obj = instance.items.model(scoring=instance)

                    obj.description = item.get("description", obj.description or "") or ""
                    obj.correct = item.get("correct", obj.correct or 0) or 0
                    obj.incorrect = item.get("incorrect", obj.incorrect or 0) or 0
                    obj.score = item.get("score", obj.score or 0) or 0
                    obj.order = desired_order
                    obj.save()
                    keep_ids.append(obj.id)

                instance.items.exclude(id__in=keep_ids).delete()

        return instance

    # กฎธุรกิจ: pass_score ≤ total score และกันค่าติดลบ
    def validate(self, attrs):
        pass_score = attrs.get("pass_score", getattr(self.instance, "pass_score", 0))
        items = attrs.get("items", None)
        if items is None and self.instance:
            items = [{"score": it.score, "correct": it.correct, "incorrect": it.incorrect}
                     for it in self.instance.items.all()]

        if pass_score is not None and int(pass_score) < 0:
            raise serializers.ValidationError({"pass_score": "ต้องเป็นค่าบวกหรือศูนย์"})

        total = sum(int(i.get("score", 0) or 0) for i in (items or []))
        if total > 0 and int(pass_score or 0) > total:
            raise serializers.ValidationError({"pass_score": f"ต้องไม่เกินคะแนนเต็มรวม ({total})"})

        # กันค่าสกอร์ติดลบในรายการ (ซ้ำกับ child validate แต่กันไว้หากบางรายการไม่ผ่าน child)
        for i, it in enumerate(items or [], start=1):
            for k in ("correct", "incorrect", "score"):
                if int(it.get(k, 0) or 0) < 0:
                    raise serializers.ValidationError({f"items[{i-1}].{k}": "ต้องเป็นค่าบวกหรือศูนย์"})
        return attrs

    # จัดลำดับ items ตอนตอบกลับ
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["items"] = sorted(data.get("items", []), key=lambda x: (x.get("order") or 0, x.get("id") or ""))
        return data

class QuizChoiceSer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = QuizChoice
        fields = ["id", "order", "text"]


class QuizQuestionSer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    choices = QuizChoiceSer(many=True)

    class Meta:
        model = QuizQuestion
        fields = ["id", "order", "type", "title", "text_parts", "correct_answers", "choices"]


class QuizSer(serializers.ModelSerializer):
    questions = QuizQuestionSer(many=True)

    class Meta:
        model = Quiz    
        fields = ["id", "course", "title", "questions"]
        read_only_fields = ["id", "course"]

    # POST / สร้างครั้งแรก
    def create(self, validated_data):
        course = self.context["course"]
        questions_data = validated_data.pop("questions", [])
        with transaction.atomic():
            quiz = Quiz.objects.create(course=course, **validated_data)
            for qd in questions_data:
                choices = qd.pop("choices", [])
                q = QuizQuestion.objects.create(quiz=quiz, **qd)
                for cd in choices:
                    QuizChoice.objects.create(question=q, **cd)
        return quiz

    # PUT / อัปเดตแบบแทนที่ทั้งหมด (upsert + ลบที่หายไป)
    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", [])
        title = validated_data.get("title", None)

        with transaction.atomic():
            if title is not None:
                instance.title = title
                instance.save(update_fields=["title"])

            # 1) ลบคำถาม/ตัวเลือกเดิมของควิซนี้ทั้งหมด
            #    (ถ้าคุณมี on_delete=CASCADE กับ Choice ก็พอแค่ลบ questions)
            instance.questions.all().delete()

            # 2) สร้างใหม่ตาม payload โดยกำหนด order = index+1
            for idx, qd in enumerate(questions_data, start=1):
                choices = qd.pop("choices", [])
                q = instance.questions.model(
                    quiz=instance,
                    order=idx,
                    type=qd.get("type"),
                    title=qd.get("title", "") or "",
                    text_parts=qd.get("text_parts", []) or [],
                    correct_answers=qd.get("correct_answers", []) or [],
                )
                q.save()

                # choices: ลิสต์ text ธรรมดา หรือมี id มาก็ไม่จำเป็นต้องใช้ (เพราะ recreate)
                bulk = []
                for ch in choices or []:
                    text = (ch.get("text") or "").strip()
                    if not text:
                        continue
                    bulk.append(q.choices.model(question=q, text=text))
                if bulk:
                    q.choices.model.objects.bulk_create(bulk)

        return instance
    
# =====  CertificateTemplateSerializer =====
class CertificateTemplateSerializer(serializers.ModelSerializer):
    """ตรงกับ models.CertificateTemplate รุ่นที่มี style / issuer_name / locale ฯลฯ"""
    class Meta:
        model = CertificateTemplate
        fields = [
            "style",
            "primary_color",
            "secondary_color",
            "course_title_override",
            "issuer_name",
            "locale",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class CertificateSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    # (ถ้าต้องการ field ย่อยอื่น ๆ เช่น student_email, course_title เพิ่มได้ แต่ไม่บังคับ)
    class Meta:
        model = Certificate
        fields = [
            "id",
            "serial_no",
            "verification_code",
            "issued_at",
            "student_name",
            "course_name",
            "completion_date",
            "render_status",
            "file_url",
        ]
        read_only_fields = fields

    def get_file_url(self, obj):
        if not obj.file:
            return None
        req = self.context.get("request")
        url = obj.file.url
        return req.build_absolute_uri(url) if req else url


# ===== Endpoints ฝั่ง “issue” แบบยืดหยุ่น (ให้ตรงกับ views.py) =====

class CertificateIssueRequest(serializers.Serializer):
    """
    ใช้กับ POST /courses/{course_id}/certificates/issue/
    - ออกให้รายชื่อเฉพาะ (issue_for_student_ids)
    - หรือออกให้ทั้งคลาส (issue_for_all_enrolled) โดย optional: เฉพาะที่จบแล้ว (issue_for_completed_only)
    """
    issue_for_student_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
    issue_for_all_enrolled = serializers.BooleanField(required=False, default=False)
    issue_for_completed_only = serializers.BooleanField(required=False, default=True)


class SaveAndIssueRequest(serializers.Serializer):
    """
    ใช้กับ POST /courses/{course_id}/certificates/save-and-issue/
    - อัปเดต template แบบ partial (ทุกฟิลด์ optional)
    - แล้ว “ออกใบจริง” ตามตัวเลือกด้านล่าง
    """
    # ส่วนเทมเพลต (optional ทั้งหมด)
    style = serializers.CharField(required=False)
    primary_color = serializers.CharField(required=False)
    secondary_color = serializers.CharField(required=False)
    course_title_override = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    issuer_name = serializers.CharField(required=False, allow_blank=True)
    locale = serializers.CharField(required=False)

    # ส่วนการออกใบ (ยืดหยุ่นเหมือน CertificateIssueRequest)
    issue_for_student_ids = serializers.ListField(
    child=serializers.UUIDField(), required=False
    )
    issue_for_all_enrolled = serializers.BooleanField(required=False, default=False)
    issue_for_completed_only = serializers.BooleanField(required=False, default=True)
    
# ===== Assignment Attachments =====
class AssignmentAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentAttachment
        fields = (
            "id",
            "title",
            "original_name",   # 👈 เพิ่ม
            "content_type",    # 👈 เพิ่ม
            "file_url",
            "created_at",
        )

    def get_file_url(self, obj):
        request = self.context.get("request")
        url = None

        # ถ้ามีไฟล์จริงใน FileField ให้ใช้ file.url
        if hasattr(obj, "file") and obj.file:
            url = obj.file.url
        # fallback ถ้ายังมีฟิลด์ url เดิมอยู่
        elif getattr(obj, "url", None):
            url = obj.url

        if not url:
            return None

        return request.build_absolute_uri(url) if request else url
    
# ===== CREATE / UPDATE =====
class AssignmentUpsertSerializer(serializers.ModelSerializer):
    """
    ใช้ตอน create / update Assignment จากหน้า edit-assignment
    - details map ไปเก็บที่ description
    - due_at / close_at map ไป field จริงใน model (due_date / close_date)
    - files เป็น write_only เอาไว้แนบไฟล์ แล้วสร้าง AssignmentAttachment ให้เอง
    """

    id = serializers.UUIDField(read_only=True)

    # FE ใช้ชื่อ details -> เก็บลง description
    details = serializers.CharField(source="description")

    # deadline จาก FE
    due_at = serializers.DateTimeField(
        source="due_date",
        required=False,
        allow_null=True,
    )

    # เวลา “ปิดรับส่งงาน” (ถ้า FE ไม่ส่งมา เราจะ default = due_at)
    close_at = serializers.DateTimeField(
        source="close_date",
        required=False,
        allow_null=True,
    )

    # แนบไฟล์ใหม่จาก FE
    files = serializers.ListField(
        child=serializers.FileField(
            max_length=None,
            allow_empty_file=False,
            use_url=False,
        ),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Assignment
        fields = [
            "id",
            "course",
            "lesson",
            "title",
            "details",       # -> description
            "assign_to_code",
            "max_score",
            "due_at",        # -> due_date
            "close_at",      # -> close_date
            "files",         # แนบไฟล์ใหม่
        ]

    # ให้ close_date มีค่าเสมอ และเช็ค logic ให้ถูก
    def validate(self, attrs):
        due = attrs.get("due_date")
        close = attrs.get("close_date")

        # ถ้าไม่ส่ง close_at มาเลย -> ใช้ค่าเดียวกับ due_at
        if close is None:
            attrs["close_date"] = due
            close = due

        # กันเคส close ก่อน due
        if due and close and close < due:
            raise serializers.ValidationError(
                {"close_at": "close_at ต้องไม่ก่อน due_at"}
            )

        # ถ้าไม่ส่ง max_score มา ตั้ง default (ถ้ามี field นี้ใน model)
        if attrs.get("max_score") is None:
            attrs["max_score"] = 0
        return attrs

    def _create_attachments(self, assignment, files):
        """สร้าง AssignmentAttachment จาก list ของไฟล์"""
        request = self.context.get("request")
        user = getattr(request, "user", None)
        bulk = []
        for f in files or []:
            bulk.append(
                AssignmentAttachment(
                    assignment=assignment,
                    uploaded_by=user,
                    file=f,
                    original_name=getattr(f, "name", ""),
                    content_type=getattr(f, "content_type", "") or "",
                    title=getattr(f, "name", ""),
                )
            )
        if bulk:
            AssignmentAttachment.objects.bulk_create(bulk)

    def create(self, validated_data):
        files = validated_data.pop("files", [])
        assignment = super().create(validated_data)
        if files:
            self._create_attachments(assignment, files)
        return assignment

    def update(self, instance, validated_data):
        files = validated_data.pop("files", None)
        assignment = super().update(instance, validated_data)
        if files:
            self._create_attachments(assignment, files)
        return assignment
    
# ===== READ (list / retrieve) =====
class AssignmentReadSerializer(serializers.ModelSerializer):
    # map ชื่อ field ใน API -> model
    details = serializers.CharField(source="description")
    due_at = serializers.DateTimeField(source="due_date")
    close_at = serializers.DateTimeField(source="close_date")
    assign_to_code = serializers.CharField(required=False)

    # แนบไฟล์ที่อยู่ในตาราง AssignmentAttachment
    attachments = AssignmentAttachmentSerializer(
    many=True,
    read_only=True,
    source="assignmentattachment_set",
    )

    class Meta:
        model = Assignment
        fields = (
            "id",
            "course",
            "lesson",
            "title",
            "details",
            "max_score",
            "due_at",
            "close_at",
            "assign_to_code",
            "created_at",
            "attachments",   # ✅ ตรงนี้สำคัญ ต้องมีคำว่า attachments
        )