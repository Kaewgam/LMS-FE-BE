from rest_framework import serializers
from pathlib import Path 
from urllib.parse import unquote
import unicodedata  
from .models import *
from .models import Education, TeachingExperience
from .models import ImportantDocument
from .models import UniversityMember, RoleChoices
from django.db import transaction, IntegrityError
from django.contrib.auth import get_user_model

class UserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for the User Management page.
    Combines data from User, University, and UniversityMember models.
    """
    # ดึงข้อมูลจาก Model ที่เชื่อมกัน
    university_name = serializers.CharField(source='university.name', read_only=True, default=None)
    # ใช้ SerializerMethodField เพื่อดึงข้อมูล Role
    university_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 
            'full_name', 
            'email', 
            'university_name',
            'university_role',
            'is_staff',     # บทบาทในระบบ (System Role)
            'is_active',    # สถานะการใช้งาน (สำหรับ Soft Delete)
            'date_joined'
        ]
    
    def get_university_role(self, obj):
        """
        ดึงข้อมูล Role ของผู้ใช้จาก UniversityMember
        """
        try:
            # ค้นหา role จาก university ที่ผูกกับ user โดยตรง
            if obj.university:
                member = UniversityMember.objects.get(user=obj, university=obj.university)
                return member.get_role_display()
        except UniversityMember.DoesNotExist:
            return "ยังไม่ได้กำหนด"
        return "ไม่มีสังกัด"

class UserDetailsSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)  # << เอา source ออก
    university_id = serializers.UUIDField(read_only=True, allow_null=True)  # << เอา source ออก
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'is_staff', 'profile_image_url',
            'role', 'is_active', 'university_id', 'university_name'
        ]
        read_only_fields = ['email', 'is_staff', 'is_active']

    def get_university_name(self, obj):
        return obj.university.name if getattr(obj, "university_id", None) else None
    
User = get_user_model()

class UserMeSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)  # << เอา source ออก
    university_id = serializers.UUIDField(read_only=True, allow_null=True)  # << เอา source ออก
    university_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "is_staff", "profile_image_url",
            "role", "is_active", "university_id", "university_name"
        ]

    def get_university_name(self, obj):
        return obj.university.name if getattr(obj, "university_id", None) else None

    def get_groups(self, obj):
        # ถ้าใช้ Django groups อยู่
        return list(obj.groups.values_list("name", flat=True))

    def get_is_instructor(self, obj):
        r = self.get_role(obj)
        return r == RoleChoices.INSTRUCTOR or str(r).lower() == "instructor"

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
        admin_email = self.initial_data.get('admin_email')  # ถ้าจะรับจาก payload จริง ให้ใส่ field เพิ่มต่างหาก
        university = University.objects.create(**validated_data)

        if admin_email:
            try:

                admin_user = User.objects.get(email__iexact=admin_email)
                UniversityMember.objects.get_or_create(
                    user=admin_user,
                    university=university,
                    defaults={'role': RoleChoices.ADMIN}  # ให้ตรงคอมเมนต์
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
        # ตรวจสอบว่าเคยเชิญอีเมลนี้ในมหาลัยนี้แล้วหรือยัง
        university = self.context.get('university')
        domain = university.email_domain
        if not domain:
            raise serializers.ValidationError("This university does not have an email domain.")
        # เช็คว่า email โดเมนเดียวกับมหาลัยนี้หรือไม่
        if not value.endswith(domain):
            raise serializers.ValidationError("This email is not in the correct domain.")
        
        user_id = User.objects.get(email__iexact=value).id
        # ตรวจสอบว่าเคยเชิญอีเมลนี้ในมหาลัยนี้แล้วหรือยัง
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

    class Meta:
        model = CourseChapter
        fields = ['id', 'course', 'title', 'description', 'content', 'position']
        # กำหนดให้ position เป็นแบบอ่านอย่างเดียวตอนสร้าง/แก้ไขปกติ
        # เพราะเราจะจัดการมันโดยอัตโนมัติใน view
        read_only_fields = ['position']

class CourseMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseMaterial
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    # แสดงข้อมูล instructor และ curriculum แบบอ่านง่ายๆ
    instructor_name = serializers.CharField(source='instructor.full_name', read_only=True)
    curriculum_name = serializers.CharField(source='curriculum.name', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'banner_img', 'level', 
            'curriculum', 'instructor', 'university', 'status', 'enroll_token', 'meeting_link',
            'created_at', 'updated_at',
            # read-only
            'instructor_name', 'curriculum_name'
        ]
        # กำหนด field ที่ไม่ต้องการให้ user กรอกตอนสร้าง/แก้ไข
        read_only_fields = ['id', 'instructor', 'university', 'created_at', 'updated_at']

    def validate_curriculum(self, value):
        # ตรวจสอบว่า curriculum ที่เลือกมานั้น อยู่ในสังกัดเดียวกับ instructor
        request = self.context.get('request')
        if not request:
            return value
            
        user = request.user
        
        # หาว่า user เป็นสมาชิกของ university ไหน
        user_university_member = UniversityMember.objects.filter(user=user).first()
        if not user_university_member:
            raise serializers.ValidationError("You are not a member of any university.")

        # ตรวจสอบว่า curriculum ที่เลือกมา อยู่ใน university เดียวกันหรือไม่
        if value.university != user_university_member.university:
            raise serializers.ValidationError("The selected curriculum does not belong to your university.")
            
        return value

class CourseUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer สำหรับ Instructor เพื่ออัปเดตข้อมูลทั่วไปของ Course
    (จะไม่อนุญาตให้อัปเดต status ผ่านทางนี้)
    """
    class Meta:
        model = Course
        # อนุญาตให้อัปเดตได้เฉพาะฟิลด์เหล่านี้
        fields = ['title', 'description', 'banner_img', 'level', 'curriculum', 'enroll_token', 'meeting_link']

class CourseStatusUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer สำหรับ Admin เพื่ออัปเดต status ของ Course เท่านั้น
    """
    class Meta:
        model = Course
        fields = ['status']
    
    def validate_status(self, value):
        if value == CourseStatus.PENDING:
            raise serializers.ValidationError("You cannot change the status of a course to pending.")
        return value

class UniversityMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityMember
        fields = ['id', 'role']
        read_only_fields = ['id']

class EnrollmentSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    enroll_token = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'status', 'enrolled_at', 'enroll_token']
        read_only_fields = ['id', 'student', 'course', 'status', 'enrolled_at']
    
    def validate(self, value):
        request = self.context.get('request')
        student = request.user

        course = self.context.get('course')

        enroll_token = value.get('enroll_token')

        if course.status != CourseStatus.ACTIVE:
            raise serializers.ValidationError("This course is not active.")
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("You are already enrolled in this course.")
        if enroll_token != course.enroll_token:
            raise serializers.ValidationError("Invalid enroll token.")
        return value
    
    def create(self, validated_data):
        return Enrollment.objects.create(
            student=self.context['request'].user,
            course=self.context['course'],
            status=EnrollmentStatus.ENROLLED
        )
    
class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for the Review model."""
    # ข้อมูลของนักเรียนที่เขียนรีวิว ที่จะแสดง
    student = BasicUserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'student', 'course', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'student', 'created_at']

    def validate(self, data):
        
        course = data.get('course')
        request = self.context.get('request')
        user = request.user

        # ตรวจสอบว่าผู้ใช้ลงเรียนคอร์สนี้หรือไม่
        if not Enrollment.objects.filter(student=user, course=course).exists():
            raise serializers.ValidationError("You must be enrolled in this course to leave a review.")

        # ตรวจสอบว่าผู้ใช้เคยรีวิวคอร์สนี้ไปแล้วหรือยัง
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
    """
    Serializer for the chapter reordering endpoint.
    Expects a list of UUIDs in the desired order.
    """
    ordered_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="A list of chapter UUIDs in the new desired order."
    )

    def validate_ordered_ids(self, value):
        if not value:
            raise serializers.ValidationError("This list cannot be empty.")
        # คุณสามารถเพิ่ม validation อื่นๆ ที่นี่ได้ถ้าต้องการ
        return value


class CertificateSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = '__all__'

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
    # ใช้สำหรับเขียนค่าไฟล์ตอนสร้าง/แก้ไข แต่ไม่ส่งออกไปใน response
    file = serializers.FileField(write_only=True, required=False, allow_null=True)

    fileName = serializers.SerializerMethodField()
    fileUrl  = serializers.SerializerMethodField()

    class Meta:
        model  = ImportantDocument
        fields = ["id", "name", "fileName", "fileUrl", "created_at", "file"]  # <- ใส่ "file" ด้วย

    def get_fileName(self, obj):
        name = getattr(obj, "original_filename", "") \
               or (Path(obj.file.name).name if getattr(obj, "file", None) else "")
        return unicodedata.normalize("NFC", unquote(name))

    def get_fileUrl(self, obj):
        if not getattr(obj, "file", None):
            return None
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url
    
class RegisterRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["STUDENT", "INSTRUCTOR"], required=False)

    university_id = serializers.UUIDField(required=False, allow_null=True)

class VerifyEmailRequestSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

class ResendVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()