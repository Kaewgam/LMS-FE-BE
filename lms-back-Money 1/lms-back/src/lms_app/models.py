from django.db import models

# Create your models here.
import uuid 
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission, UserManager
from django.conf import settings
from .managers import CustomUserManager
from django.db.models import UniqueConstraint


class University(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email_domain = models.CharField(max_length=255, unique=False)
    created_at = models.DateTimeField(auto_now_add=True)

class RoleChoices(models.TextChoices):
    STUDENT = "STUDENT", "Student"
    INSTRUCTOR = "INSTRUCTOR", "Instructor"
    ADMIN = "ADMIN", "Admin"

class User(AbstractUser):

    username = None
    email = models.EmailField(unique=True)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    university = models.ForeignKey(University, on_delete=models.CASCADE, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_image_url = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)  # เพิ่ม
    bio = models.TextField(blank=True, null=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    is_superuser = models.BooleanField(default=False) 
    is_staff = models.BooleanField(default=False) 
    is_active = models.BooleanField(default=True)

    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.STUDENT,
        db_index=True,
)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']
    
    objects = CustomUserManager()

    def __str__(self):
        return self.email

class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', 'ผู้ดูแล'
    INSTRUCTOR = 'INSTRUCTOR', 'ผู้สอน'
    STUDENT = 'STUDENT', 'นักเรียน'

class UniversityMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="members")
    role = models.CharField(max_length=20, choices=RoleChoices.choices, default=RoleChoices.STUDENT)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:

        constraints = [
            UniqueConstraint(fields=['user', 'university'], name='unique_user_university_role')
        ]

    def __str__(self):
        return f'{self.user.email} - {self.university.name} ({self.role})'

class InstructorInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    university = models.ForeignKey(University, on_delete=models.CASCADE, default=None, null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    invited_at = models.DateTimeField(auto_now_add=True)

class InstructorProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name="instructorprofile")
    motto = models.TextField(blank=True, default="")
    def __str__(self):
        return f"Profile({self.user_id})"
    
class Education(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    level = models.CharField(max_length=50)               # ใช้ข้อความไทยได้เลย
    university = models.CharField(max_length=255)
    start_year = models.PositiveSmallIntegerField()
    end_year = models.PositiveSmallIntegerField(null=True, blank=True)  # ← ต้องให้ว่างได้

    def __str__(self):
        return f"{self.level} @ {self.university}"

class TeachingExperience(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="teachings")
    topic = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_year = models.PositiveIntegerField()
    end_year = models.PositiveIntegerField(null=True, blank=True)  # ปัจจุบัน = null
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.topic

class Curriculum(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    university = models.ForeignKey(University, on_delete=models.CASCADE)


class CourseLevel(models.TextChoices):
    BEGINNER = 'beginner'
    INTERMEDIATE = 'intermediate'
    ADVANCED = 'advanced'


class CourseStatus(models.TextChoices):
    PENDING = 'pending'
    ACTIVE = 'active'
    DENIED = 'denied'
    ARCHIVED = 'archived'


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    banner_img = models.TextField()
    level = models.CharField(max_length=20, choices=CourseLevel.choices)
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='instructed_courses')
    university = models.ForeignKey(University, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=CourseStatus.choices)
    enroll_token = models.CharField(max_length=255, null=False, blank=True, default='')
    meeting_link = models.TextField(null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CourseChapter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    content = models.TextField()
    position = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


class MaterialType(models.TextChoices):
    VIDEO = 'video'
    PDF = 'pdf'
    DOC = 'doc'
    URL = 'url'
    IMAGE = 'image'
    NOTEBOOK = 'notebook'
    INTERACTIVE = 'interactive'


class CourseMaterial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chapter = models.ForeignKey(CourseChapter, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=MaterialType.choices)
    path = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class CourseFavorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class EnrollmentStatus(models.TextChoices):
    ENROLLED = 'enrolled'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices)
    enrolled_at = models.DateTimeField(auto_now_add=True)


class TestType(models.TextChoices):
    CHAPTER = 'chapter_quiz'
    FINAL = 'final'


class Test(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TestType.choices)
    max_attempts = models.IntegerField()
    passing_score = models.FloatField()
    enable_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)


class QuestionType(models.TextChoices):
    MCQ = 'mcq'
    TRUEFALSE = 'truefalse'
    FILLBLANK = 'fillblank'
    SHORTANSWER = 'shortanswer'
    ESSAY = 'essay'


class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    content = models.TextField()
    type = models.CharField(max_length=20, choices=QuestionType.choices)
    options = models.JSONField()
    correct_answer = models.JSONField()


class Submission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    score = models.FloatField()
    submitted_at = models.DateTimeField(auto_now_add=True)


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    certificate_url = models.CharField(max_length=255)
    issued_at = models.DateTimeField()


class CourseProgression(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    chapter = models.ForeignKey(CourseChapter, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_by = models.CharField(max_length=255)


class ComplaintStatus(models.TextChoices):
    OPEN = 'open'
    IN_PROGRESS = 'in_progress'
    RESOLVED = 'resolved'


class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    submitted_at = models.DateTimeField(auto_now_add=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_complaints')
    status = models.CharField(max_length=20, choices=ComplaintStatus.choices)


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    uploader = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE)
    university = models.ForeignKey(University, on_delete=models.CASCADE)


class Assignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    max_score = models.FloatField()
    due_date = models.DateTimeField()
    close_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)


class AssignmentSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    submitted_at = models.DateTimeField()
    score = models.FloatField()
    feedback = models.TextField()
    graded_at = models.DateTimeField()
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='graded_submissions')


class AssignmentAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, null=True, blank=True)
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, null=True, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class CoursePricing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.OneToOneField(Course, on_delete=models.CASCADE)
    price = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)


class OrderStatus(models.TextChoices):
    PENDING = 'pending'
    PAID = 'paid'
    FAILED = 'failed'
    REFUNDED = 'refunded'


class Order(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    amount_paid = models.FloatField()
    currency = models.CharField(max_length=10, default='THB')
    status = models.CharField(max_length=20, choices=OrderStatus.choices)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ImportantDocument(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="important_docs/")
    
    original_filename = models.CharField(max_length=255, blank=True, default="")
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
        
    )
    created_at = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
    