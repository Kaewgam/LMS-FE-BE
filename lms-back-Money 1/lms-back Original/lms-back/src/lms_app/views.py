# ===== Python Standard Library =====
from pathlib import Path
from urllib.parse import quote
import requests
import unicodedata
from typing import Optional, List
import logging
from django.conf import settings 

# ===== Django & DRF Core =====
from django.db import transaction, IntegrityError
from django.db.models import Max, Count, Q
from django.http import FileResponse, Http404,HttpResponse   
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets, permissions, status, mixins, parsers, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.filters import SearchFilter, OrderingFilter

# ===== DRF JWT =====
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

# ===== drf-spectacular (Swagger/OpenAPI) =====
from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view
from drf_spectacular.types import OpenApiTypes
from django.db.models.deletion import ProtectedError, RestrictedError
import secrets
from .utils.cert_pdf import render_and_attach_pdf

# ===== Django Filters =====
from django_filters.rest_framework import DjangoFilterBackend

# ===== Local Imports (models/serializers/permissions) =====
from .models import (
    User, University, UniversityMember, InstructorInvitation, Curriculum,
    Course, CourseChapter, Enrollment, Review, Complaint,
    InstructorProfile, ImportantDocument, Education, TeachingExperience,
    RoleChoices, CourseStatus, Category, CourseMaterial, Quiz,
    EnrollmentStatus, Certificate, CertificateTemplate,
)
from django.shortcuts import get_object_or_404

from .serializers import (
    LoginSerializer,
    TokenPairSerializer,
    UserMeSerializer,
    UserDetailsSerializer,
    GoogleTokenLoginSerializer,
    UniversitySerializer,
    UniversityMemberSerializer,
    UniversityMemberUpdateSerializer,
    InstructorInvitationSerializer,
    CurriculumSerializer,
    CourseSerializer,
    CourseUpdateSerializer,
    CourseStatusUpdateSerializer,
    EnrollmentSerializer,
    CourseMemberCreateSerializer,
    ReviewSerializer,
    ImportantDocumentSerializer,
    EducationSerializer,
    TeachingSerializer,
    CourseChapterSerializer,
    ChapterReorderSerializer,
    UserManagementSerializer,
    CategorySerializer,
    CourseCreateSerializer,
    CourseMaterialSerializer,
    CourseMaterialUploadSerializer,
    QuizSer,
    CertificateSerializer,
    CertificateIssueRequest,
    CertificateTemplateSerializer,
    SaveAndIssueRequest,
)

from .permissions import (
    IsUniversityAdmin,
    IsUniversityMember,
    IsUniversityInstructor,
    IsCourseOwnerOrAdmin,
    IsCourseOwner,
    IsOwnerOrReadOnly,
    IsInstructorRole,
    IsDocumentOwnerOrAdmin,
    IsCourseInstructor,
    IsInstructorOrAdmin,
)

from django.utils import timezone
import os

from .renderers.pdf_renderer import render_certificate_pdf
FONT_DIR = os.path.join(settings.BASE_DIR, "lms_app", "fonts")


@api_view(["GET"])
@permission_classes([AllowAny])
def certificate_public_detail(request, pk):
    token = request.query_params.get("token", "")
    if token != getattr(settings, "CERT_RENDER_TOKEN", ""):
        return Response({"detail": "Forbidden"}, status=403)

    cert = get_object_or_404(Certificate.objects.select_related("course", "template"), pk=pk)
    tpl = cert.template or getattr(cert.course, "certificate_template", None)

    data = {
        "id": str(cert.id),
        "studentName": cert.student_name,
        "courseName": cert.course_name,
        "instructorName": cert.instructor_name,
        "completionDate": cert.completion_date.strftime("%d/%m/%Y"),
        "serialNo": cert.serial_no,
        "verificationCode": cert.verification_code,

        "template": tpl.style if tpl else "classic",
        "primaryColor": tpl.primary_color if tpl else "#881337",
        "secondaryColor": tpl.secondary_color if tpl else "#1f2937",
    }
    return Response(data)

logger = logging.getLogger(__name__)


class UserMeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user


class InstructorMeView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    @extend_schema(responses=OpenApiTypes.OBJECT)
    def get(self, request):
        user_data = self.get_serializer(request.user).data
        profile = getattr(request.user, "instructorprofile", None)
        educations = Education.objects.filter(user=request.user).order_by("-start_year")
        teachings = TeachingExperience.objects.filter(user=request.user).order_by(
            "-start_year"
        )

        return Response(
            {
                "user": user_data,
                "profile": {"motto": getattr(profile, "motto", "")},
                "educations": EducationSerializer(educations, many=True).data,
                "teachings": TeachingSerializer(teachings, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class MyEducationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EducationSerializer  # ← ให้ตรงกับ serializer ของ Education
    queryset = Education.objects.none()

    def get_queryset(self):
        # กันตอน gen schema ของ spectacular
        if getattr(self, "swagger_fake_view", False):
            return Education.objects.none()

        user = self.request.user
        if not user or not user.is_authenticated:
            return Education.objects.none()
        return Education.objects.filter(user_id=user.id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        # ⬅️ ห้ามเปลี่ยนเจ้าของ และไม่ต้อง set user ซ้ำตอนแก้ไข
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Not your education record")
        serializer.save()


class MyTeachingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TeachingSerializer
    queryset = TeachingExperience.objects.none()

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return TeachingExperience.objects.none()
        if not self.request.user.is_authenticated:
            return TeachingExperience.objects.none()
        return TeachingExperience.objects.filter(user=self.request.user).order_by(
            "-start_year"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Not your teaching record")
        serializer.save()


class InstructorProfileView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = (
        UserMeSerializer  # ถ้ามี InstructorProfileSerializer ให้เปลี่ยนเป็นตัวนั้น
    )

    @extend_schema(request=OpenApiTypes.OBJECT, responses={200: OpenApiTypes.OBJECT})
    def patch(self, request):
        profile, _ = InstructorProfile.objects.get_or_create(user=request.user)
        profile.motto = request.data.get("motto", "") or ""
        profile.save(update_fields=["motto"])
        return Response({"motto": profile.motto}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class GoogleTokenLogin(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = GoogleTokenLoginSerializer  # << สำคัญ

    @extend_schema(
        request=GoogleTokenLoginSerializer,
        responses={200: OpenApiTypes.OBJECT},  # response เป็น object รวม token + user
    )
    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"detail": "Missing 'access_token'."}, status=400)

        try:
            r = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if r.status_code != 200:
                try:
                    return Response(
                        {"detail": "Google userinfo failed", "google": r.json()},
                        status=400,
                    )
                except Exception:
                    return Response(
                        {"detail": "Google userinfo failed", "raw": r.text}, status=400
                    )

            info = r.json()
            email = info.get("email")
            email_verified = info.get("email_verified", False)
            full_name = info.get("name") or info.get("given_name") or ""
            picture = info.get("picture")

            if not email:
                return Response({"detail": "Google did not return email."}, status=400)

            user, created = User.objects.get_or_create(
                email=email, defaults={"full_name": full_name}
            )

            updated_fields = []
            if full_name and user.full_name != full_name:
                user.full_name = full_name
                updated_fields.append("full_name")
            if picture and getattr(user, "profile_image_url", None) != picture:
                user.profile_image_url = picture
                updated_fields.append("profile_image_url")
            if updated_fields:
                user.save(update_fields=updated_fields)

            if not user.is_active:
                if email_verified:
                    user.is_active = True
                    user.save(update_fields=["is_active"])
                else:
                    return Response({"detail": "email not verified"}, status=403)

            refresh = RefreshToken.for_user(user)
            user_data = UserMeSerializer(user, context={"request": request}).data

            requested_role_raw = (request.data.get("role") or "").strip().upper()
            requested_role = (
                requested_role_raw
                if requested_role_raw in ["INSTRUCTOR", "STUDENT"]
                else None
            )
            if requested_role and getattr(user, "role", None) != requested_role:
                user.role = requested_role
                user.save(update_fields=["role"])

            try:
                with transaction.atomic():
                    if user.university_id:
                        defaults_role = (
                            getattr(user, "role", None) or RoleChoices.STUDENT
                        )
                        member, created = UniversityMember.objects.get_or_create(
                            user=user,
                            university=user.university,
                            defaults={"role": defaults_role},
                        )
                        if (not created) and member.role != defaults_role:
                            member.role = defaults_role
                            member.save(update_fields=["role"])

                    invite = InstructorInvitation.objects.filter(
                        email=user.email, university=user.university, is_accepted=False
                    ).first()
                    is_admin = UniversityMember.objects.filter(
                        user=user, university=user.university, role=RoleChoices.ADMIN
                    ).exists()
                    if invite:
                        if is_admin:
                            invite.delete()
                        else:
                            invite.is_accepted = True
                            invite.save()
                            UniversityMember.objects.filter(
                                user=user, university=user.university
                            ).update(role=RoleChoices.INSTRUCTOR)
            except Exception as e:
                print(f"[GoogleTokenLogin] membership warn: {e}")

            return Response(
                {
                    "user": user_data,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=200,
            )
        except Exception as e:
            print(f"[GoogleTokenLogin] fatal: {e}")
            return Response({"detail": "Authentication failed."}, status=500)


class UniversityViewSet(viewsets.ModelViewSet):
    queryset = University.objects.all().order_by("name")
    serializer_class = UniversitySerializer

    def get_permissions(self):
        if self.action in ["invite_instructor", "members"]:
            permission_classes = [IsUniversityAdmin]

        elif self.action == "curriculums":
            # 👇 อนุญาตให้ผู้ที่ล็อกอินแล้วเรียกดูได้ แม้ไม่ใช่ member ของ uni
            if self.request.method == "GET":
                permission_classes = [
                    permissions.IsAuthenticated
                ]  # หรือ AllowAny ถ้าอยากให้ public
            else:
                permission_classes = [IsUniversityAdmin]

        else:
            permission_classes = [permissions.IsAdminUser]

        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["get"], url_path="search-external")
    def search_external(self, request):
        """
        ดึงข้อมูลมหาวิทยาลัยจาก API ภายนอกเพื่อใช้เป็นคำแนะนำ
        ตัวอย่าง: /api/universities/search-external/?name=King
        """

        name = request.query_params.get("name", "")
        try:
            api_url = (
                f"http://universities.hipolabs.com/search?country=Thailand&name={name}"
            )
            response = requests.get(api_url)
            response.raise_for_status()  # แจ้งเตือนถ้า API ตอบกลับมาเป็น error
            data = response.json()

            # จัดรูปแบบข้อมูลเพื่อให้ใช้งานง่ายขึ้น
            formatted_data = [
                {
                    "name": uni.get("name"),
                    "domain": uni.get("domains", [None])[0],  # เอาเฉพาะโดเมนแรก
                }
                for uni in data
                if uni.get("domains")
            ]

            return Response(formatted_data, status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to fetch data from external API: {e}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @extend_schema(
        summary="Invite Instructor",
        description="POST: Invite a new instructor to this university by email.",
        request=InstructorInvitationSerializer,
        responses={201: InstructorInvitationSerializer},
    )
    @action(detail=True, methods=["post"], url_path="invite-instructor")
    def invite_instructor(self, request, pk=None):
        """
        Endpoint สำหรับ Admin ของมหาลัยเพื่อเชิญ Instructor
        URL: /api/universities/{university_id}/invite-instructor/
        """
        university = self.get_object()  # ดึง University object
        serializer = InstructorInvitationSerializer(
            data=request.data, context={"university": university}
        )

        if serializer.is_valid():
            serializer.save(invited_by=request.user, university=university)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="List/Create Curriculums",
        description="GET: List all curriculums for a university. POST: Create a new curriculum for this university.",
        request=CurriculumSerializer,
        responses={200: CurriculumSerializer(many=True), 201: CurriculumSerializer},
    )
    @action(detail=True, methods=["get", "post"], url_path="curriculums")
    def curriculums(self, request, pk=None):
        """
        Endpoint สำหรับดูและสร้างหลักสูตรของมหาวิทยาลัย
        GET: /api/universities/{id}/curriculums/
        POST: /api/universities/{id}/curriculums/
        """
        university = self.get_object()

        if request.method == "GET":
            curriculums = Curriculum.objects.filter(university=university)
            serializer = CurriculumSerializer(curriculums, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = CurriculumSerializer(
                data=request.data, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save(university=university)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="List University Members",
        description="GET: List all members and their roles in this university.",
        responses={200: UniversityMemberSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="members")
    def members(self, request, pk=None):
        """
        Endpoint สำหรับดูรายชื่อสมาชิกรวมถึงบทบาทในมหาวิทยาลัย
        GET: /api/universities/{id}/members/
        """
        university = self.get_object()

        members = UniversityMember.objects.filter(university=university).select_related(
            "user"
        )
        serializer = UniversityMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="stats")
    def stats(self, request, pk=None):
        """
        Endpoint สำหรับดึงข้อมูลสถิติของมหาวิทยาลัย
        GET: /api/universities/{id}/stats/
        """
        university = self.get_object()

        # คำนวณค่าต่างๆ
        total_courses = Course.objects.filter(university=university).count()

        # นับจำนวนสมาชิกตามrole
        member_counts = (
            UniversityMember.objects.filter(university=university)
            .values("role")
            .annotate(count=Count("id"))
        )

        stats_data = {
            "total_courses": total_courses,
            "total_students": 0,
            "total_instructors": 0,
            "total_complaints": Complaint.objects.filter(
                submitted_by__university=university
            ).count(),
        }

        for item in member_counts:
            if item["role"] == RoleChoices.STUDENT:
                stats_data["total_students"] = item["count"]
            elif item["role"] == RoleChoices.INSTRUCTOR:
                stats_data["total_instructors"] = item["count"]

        return Response(stats_data, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name="university_id",
                description="The ID of the university to filter by.",
                required=False,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="instructor",
                description="Filter by instructor UUID. Use 'me' for current user.",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="status",
                description="Filter by course status: DRAFT | PENDING | APPROVED | REJECTED | ACTIVE | DENIED | ARCHIVED",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="q",
                description="Search by title/description (icontains).",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="title__iexact",
                description="Exact (case-insensitive) title match for duplicate check (normalized by collapsing spaces).",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
        ]
    ),
)
class CourseViewSet(viewsets.ModelViewSet):
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        "title": ["exact", "iexact"],
        "curriculum": ["exact"],
        "category": ["exact"],
        "status": ["exact"],
        "university": ["exact"],
    }
    search_fields = ["title", "description"]
    ordering_fields = ["updated_at", "created_at", "title"]

    def get_serializer_class(self):
        if self.action == "create":
            return CourseCreateSerializer
        if self.action in ["update", "partial_update"]:
            return CourseUpdateSerializer
        return CourseSerializer

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsInstructorOrAdmin]
        elif self.action in [
            "update",
            "partial_update",
            "archive",
            "destroy",
            "cascade_delete",
        ]:
            permission_classes = [IsCourseOwnerOrAdmin]
        elif self.action in ["update_status"]:
            permission_classes = [IsUniversityAdmin]
        else:  # list, retrieve
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        # ให้ serializer.create() จัดการเรื่อง instructor / university / status เอง
        serializer.save()

    def get_queryset(self):
        """
        Filters:
          - ?instructor=<uuid>|me
          - ?university_id=<uuid>
          - ?status=DRAFT|PENDING|APPROVED|REJECTED|ACTIVE|DENIED|ARCHIVED
          - ?q=<text>
          - ?title__iexact=<title>
        Default: only current user's owned or enrolled.
        """
        user = self.request.user
        qs = Course.objects.all()

        instr = self.request.query_params.get("instructor")
        uni = self.request.query_params.get("university_id")
        stat = (self.request.query_params.get("status") or "").strip().upper()
        q = self.request.query_params.get("q")
        title_iexact = self.request.query_params.get("title__iexact")

        if instr:
            if instr == "me" and user.is_authenticated:
                qs = qs.filter(instructor_id=user.id)
            else:
                qs = qs.filter(instructor_id=instr)

        if uni:
            qs = qs.filter(university_id=uni)

        allowed_status = {
            "DRAFT",
            "PENDING",
            "APPROVED",
            "REJECTED",
            "ACTIVE",
            "DENIED",
            "ARCHIVED",
        }
        if stat in allowed_status:
            qs = qs.filter(status=stat)

        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        if title_iexact:
            if user.is_authenticated and getattr(user, "university_id", None):
                qs = qs.filter(university_id=user.university_id)
            qs = qs.filter(title__iexact=" ".join(title_iexact.split()))

        applied_any_filter = bool(
            instr or uni or (stat in allowed_status) or q or title_iexact
        )
        if not applied_any_filter:
            if user.is_authenticated:
                qs = qs.filter(
                    Q(instructor=user) | Q(enrollments__student=user)
                ).distinct()
            else:
                qs = qs.none()

        return qs.order_by("-updated_at", "-created_at")

    def perform_update(self, serializer):
        """
        Owner update → reset status เป็น PENDING
        University admin → อนุญาตให้แก้ไขได้โดยไม่เปลี่ยนสถานะ
        """
        user = self.request.user
        instance: Course = serializer.instance

        # เป็นเจ้าของคอร์ส (ผู้สอนคนสร้างคอร์สนี้)
        is_owner = getattr(instance, "instructor_id", None) == getattr(user, "id", None)

        # เป็นแอดมินของมหาวิทยาลัยเดียวกับคอร์สนี้
        is_admin = UniversityMember.objects.filter(
            user=user,
            university=instance.university,
            role=RoleChoices.ADMIN,
        ).exists()

        if is_owner:
            # ถ้าเป็นเจ้าของคอร์ส → แก้แล้วต้องให้กลับไป PENDING เหมือนเดิม
            serializer.save(status=CourseStatus.PENDING)
        elif is_admin:
            # ถ้าเป็น admin มหาวิทยาลัย → อนุญาตให้แก้โดยไม่เปลี่ยน status
            serializer.save()
        else:
            # กันเคสอื่น ๆ ไว้เผื่อใช้ endpoint ผิดสิทธิ์
            raise serializers.ValidationError(
                "Only owner or university admin can update the course"
            )

    @extend_schema(
        summary="Update course status",
        request=CourseStatusUpdateSerializer,
        responses={200: CourseStatusUpdateSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_status(self, request, pk=None):
        course = self.get_object()
        serializer = CourseStatusUpdateSerializer(
            course, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(
        summary="Archive a course (toggle ARCHIVED/ACTIVE)",
        responses={200: CourseStatusUpdateSerializer},
    )
    @action(detail=True, methods=["patch"], url_path="archive")
    def archive(self, request, pk=None):
        course = self.get_object()
        if course.status == CourseStatus.PENDING:
            return Response(
                {"detail": "The course has yet to be approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if course.status == CourseStatus.DENIED:
            return Response(
                {"detail": "The course has been denied."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        course.status = (
            CourseStatus.ARCHIVED
            if course.status != CourseStatus.ARCHIVED
            else CourseStatus.ACTIVE
        )
        course.save(update_fields=["status"])
        return Response(
            {"status": "Course archived successfully"}, status=status.HTTP_200_OK
        )

    @extend_schema(
        summary="Enroll with token",
        request=EnrollmentSerializer,
        responses={201: EnrollmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="enroll")
    def enroll(self, request, pk=None):
        course = self.get_object()
        serializer = EnrollmentSerializer(
            data=request.data, context={"request": request, "course": course}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
    summary="List / add course members",
    responses={200: EnrollmentSerializer(many=True)},
    )
    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        """
        GET  /api/courses/{id}/members/      → รายชื่อผู้เรียนในคอร์ส
        POST /api/courses/{id}/members/      → เพิ่มผู้เรียน (สำหรับ staff)
            body: { "student_id": "<uuid ของ user>" }
        """
        course = self.get_object()

        # --------- GET: list members ----------
        if request.method.lower() == "get":
            enrollments = Enrollment.objects.filter(course=course)
            serializer = EnrollmentSerializer(enrollments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # --------- POST: add member ----------
        serializer = CourseMemberCreateSerializer(
            data=request.data,
            context={"request": request, "course": course},
        )
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()

        out = EnrollmentSerializer(enrollment)
        return Response(out.data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
    summary="Remove course member",
    responses={204: None},
    )
    @action(
        detail=True,
        methods=["delete"],
        url_path="members/(?P<enrollment_id>[^/.]+)",
    )
    def remove_member(self, request, pk=None, enrollment_id=None):
        """
        DELETE /api/courses/{course_id}/members/{enrollment_id}/

        ใช้สำหรับให้ staff / admin ลบผู้เรียนออกจากคอร์ส
        """
        course = self.get_object()
        try:
            enrollment = Enrollment.objects.get(id=enrollment_id, course=course)
        except Enrollment.DoesNotExist:
            raise Http404("Enrollment not found")

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def destroy(self, request, *args, **kwargs):
        force = request.query_params.get("force") in ("1", "true", "yes")
        cascade = request.query_params.get("cascade") in ("1", "true", "yes")
        course = self.get_object()

        if force and cascade:
            return self._cascade_delete(course)

        try:
            return super().destroy(request, *args, **kwargs)

        # ⬇️  กรณีมีความสัมพันธ์คุ้มกันการลบ
        except (ProtectedError, RestrictedError) as e:
            objs = getattr(e, "protected_objects", None) or getattr(
                e, "restricted_objects", None
            )
            return Response(
                {
                    "detail": "ไม่สามารถลบคอร์สได้ เนื่องจากยังมีข้อมูลที่อ้างอิงอยู่",
                    "type": e.__class__.__name__,
                    "blocked_by": [str(o) for o in (objs or [])],
                },
                status=status.HTTP_409_CONFLICT,
            )

        # ⬇️  กัน constraint อื่น ๆ
        except IntegrityError as e:
            return Response(
                {"detail": str(e), "type": "IntegrityError"},
                status=status.HTTP_409_CONFLICT,
            )

        # ⬇️  กันทุกกรณีไม่ให้เป็น HTML 500
        except Exception as e:
            logger.exception("Course destroy failed")
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ===== helpers & action สำหรับลบแบบเคสเคด =====
    def _cascade_delete(self, course):
        from .models import CourseMaterial, CourseChapter, Enrollment, Review, Quiz

        with transaction.atomic():
            CourseMaterial.objects.filter(chapter__course=course).delete()
            Quiz.objects.filter(course=course).delete()
            Enrollment.objects.filter(course=course).delete()
            Review.objects.filter(course=course).delete()
            CourseChapter.objects.filter(course=course).delete()
            course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["delete"], url_path="cascade")
    def cascade_delete(self, request, pk=None):
        course = self.get_object()
        return self._cascade_delete(course)


class UniversityMemberViewSet(
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """
    ViewSet สำหรับจัดการ (แก้ไข/ลบ) สมาชิกในมหาวิทยาลัย
    """

    queryset = UniversityMember.objects.all()
    serializer_class = UniversityMemberUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsUniversityAdmin]

    def get_object(self):
        # ตรวจสอบสิทธิ์การเข้าถึง University ก่อน
        obj = super().get_object()
        self.check_object_permissions(self.request, obj.university)
        return obj

    def update(self, request, *args, **kwargs):
        """
        Override
        """
        member_to_update = self.get_object()

        # --- กันการแก้ไขตัวเอง ---
        if member_to_update.user == request.user:
            return Response(
                {"detail": "You cannot change your own role."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Override
        """
        member_to_delete = self.get_object()

        # --- กันการลบตัวเอง ---
        if member_to_delete.user == request.user:
            return Response(
                {"detail": "You cannot remove yourself from the university."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        parameters=[
            OpenApiParameter(
                name="course_id",
                description="The ID of the course to filter chapters by.",
                required=True,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
            ),
        ]
    ),
)
class CourseChapterViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = CourseChapter.objects.all().order_by("position")
    serializer_class = CourseChapterSerializer
    permission_classes = [IsAuthenticated]
    # ถ้า id เป็น UUID field แนะนำให้ระบุเพื่อความชัด
    # lookup_field = "id"

    # ----- Utils -----
    def _get_course_from_param(self) -> Optional[Course]:
        course_param = self.request.query_params.get(
            "course"
        ) or self.request.query_params.get("course_id")
        if not course_param:
            return None
        try:
            return Course.objects.get(id=course_param)
        except Course.DoesNotExist:
            return None

    def _assert_course_permission(self, course: Course):
        user = self.request.user
        is_owner = getattr(course, "instructor_id", None) == getattr(user, "id", None)
        if not (is_owner or user.is_staff):
            raise PermissionDenied(
                "You don't have permission to modify chapters of this course."
            )

    # ----- Queryset -----
    def get_queryset(self):
        """กรองตามคอร์สเฉพาะตอน list; รายการเดี่ยวไม่บังคับ ?course"""
        qs = super().get_queryset()

        # action อื่น ๆ (retrieve/update/partial_update/destroy) ให้ใช้ qs ปกติ
        if getattr(self, "action", None) != "list":
            return qs

        # เฉพาะ list เท่านั้นที่ต้องกรองตามคอร์ส
        course = self._get_course_from_param()
        if not course:
            return CourseChapter.objects.none()

        qs = qs.filter(course=course)

        # map ordering=order -> position
        ordering_param = self.request.query_params.get("ordering")
        if ordering_param and ordering_param.lstrip("-") == "order":
            qs = qs.order_by(
                "-position" if ordering_param.startswith("-") else "position"
            )
        elif ordering_param:
            qs = qs.order_by(ordering_param)

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    # ----- Create / Update -----
    def perform_create(self, serializer):
        """
        ใส่ค่า position เองถ้าไม่ได้ส่งมา + ตรวจสิทธิ์
        รองรับ body ที่ส่ง order (map → position)
        """
        course = serializer.validated_data["course"]
        self._assert_course_permission(course)

        # order ถูก map เป็น position ผ่าน serializer (source="position")
        position = serializer.validated_data.get("position")
        if position in (None, ""):
            # auto set next position ภายในคอร์สเดียวกัน
            max_pos = CourseChapter.objects.filter(course=course).aggregate(
                m=Max("position")
            )["m"]
            position = (max_pos or 0) + 1

        serializer.save(position=position)

    def update(self, request, *args, **kwargs):
        """
        PUT/PATCH รองรับ multipart + map 'order' → position.
        """
        partial = kwargs.pop("partial", False)
        instance: CourseChapter = self.get_object()
        self._assert_course_permission(instance.course)

        data = request.data.copy()

        # ถ้า FE ส่ง order มา ให้ map เป็น position
        order_val = data.get("order")
        if order_val is not None and order_val != "":
            data["position"] = order_val

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # ถ้าไม่ได้ส่ง position มา ก็ใช้ค่าเดิม
        serializer.save(
            position=serializer.validated_data.get("position", instance.position)
        )
        return Response(serializer.data)

    # ----- Delete -----
    def destroy(self, request, *args, **kwargs):
        instance: CourseChapter = self.get_object()
        self._assert_course_permission(instance.course)
        return super().destroy(request, *args, **kwargs)

    # ----- Reorder -----
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, *args, **kwargs):
        """
        POST /api/chapters/reorder/
        Body: { "ordered_ids": ["uuidA","uuidB", ...] }
        * จะอัปเดต position ตามลำดับ array เริ่มจาก 1
        * ตรวจสิทธิ์ด้วยว่าเป็นเจ้าของคอร์ส
        """
        ordered_ids: List[str] = request.data.get("ordered_ids", [])
        if not ordered_ids or not isinstance(ordered_ids, list):
            return Response(
                {"detail": "ordered_ids list is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # โหลด chapters ที่ตรง id
        chapters = list(CourseChapter.objects.filter(id__in=ordered_ids))
        if not chapters:
            return Response(
                {"detail": "No chapters found for given IDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ตรวจสิทธิ์โดยดูจากคอร์สของรายการแรก (ถือว่าเป็นคอร์สเดียวกัน)
        course = chapters[0].course
        self._assert_course_permission(course)

        # สร้าง map id -> object กันวน query
        ch_map = {str(c.id): c for c in chapters}

        try:
            with transaction.atomic():
                for idx, ch_id in enumerate(ordered_ids, start=1):
                    ch = ch_map.get(ch_id)
                    if ch:
                        ch.position = idx
                CourseChapter.objects.bulk_update(chapters, ["position"])
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"status": "Chapters reordered successfully"}, status=status.HTTP_200_OK
        )


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating, viewing, and managing course reviews.
    """

    queryset = Review.objects.all().select_related("student").order_by("-created_at")
    serializer_class = ReviewSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        URL: /api/reviews/?course_id=<course_uuid>
        """
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course_id")
        if course_id:
            return queryset.filter(course_id=course_id)
        # ถ้าไม่ระบุ course_id, ไม่คืนค่าใดๆ เพื่อป้องกันการดึงข้อมูลที่ไม่จำเป็น
        return queryset.none()

    def perform_create(self, serializer):

        serializer.save(student=self.request.user)


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for system staff to manage all users.
    Provides filtering, searching, and sorting capabilities.
    """

    queryset = User.objects.all().select_related("university").order_by("-date_joined")
    serializer_class = UserManagementSerializer
    permission_classes = [permissions.IsAdminUser]  # อนุญาตเฉพาะ is_staff=True

    # --- ตั้งค่าการกรอง, ค้นหา, และจัดเรียง ---
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = {
        "university": ["exact"],
        "universitymember__role": ["exact"],
        "is_staff": ["exact"],
        "is_active": ["exact"],
    }

    # ตั้งค่าฟิลด์สำหรับ Search
    search_fields = ["full_name", "email"]

    # ตั้งค่าฟิลด์สำหรับ Sort
    ordering_fields = ["full_name", "university__name", "date_joined"]

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        """
        Action สำหรับระงับการใช้งานผู้ใช้ (Soft Delete)
        """
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "You cannot suspend yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"detail": "User is already suspended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # if user is superuser, don't allow to suspend
        if user.is_superuser:
            return Response(
                {"detail": "You cannot suspended this user"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.is_active = not user.is_active  # สลับสถานะ
        user.save()
        return Response(
            {"status": f'User is now {"active" if user.is_active else "suspended"}'}
        )


class IsStaffAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )


class ImportantDocumentViewSet(viewsets.ModelViewSet):
    queryset = ImportantDocument.objects.all()
    serializer_class = ImportantDocumentSerializer
    permission_classes = [IsStaffAdmin]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        uploaded = self.request.FILES.get("file")
        serializer.save(
            uploaded_by=self.request.user,
            original_filename=(uploaded.name if uploaded else ""),
        )


class InstructorDocumentViewSet(viewsets.ModelViewSet):
    """
    ผู้สอนจัดการเอกสารของตัวเอง: /api/instructor/documents/
    """

    serializer_class = ImportantDocumentSerializer
    permission_classes = [IsAuthenticated, IsInstructorRole, IsDocumentOwnerOrAdmin]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get_queryset(self):
        # เห็นเฉพาะของตัวเอง
        return ImportantDocument.objects.filter(uploaded_by=self.request.user).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save()  # owner+original_filename เซตใน serializer.create แล้ว


class ImportantDocumentReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    สำหรับนักศึกษา/ผู้ใช้ทั่วไป: อ่านรายการเอกสารเท่านั้น
    เงื่อนไขเริ่มต้น: เอกสารถูกอัปโดยผู้สอนหรือแอดมิน
    """

    serializer_class = ImportantDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ImportantDocument.objects.all()

        # กรองเฉพาะที่อาจารย์/แอดมินอัปโหลด
        qs = qs.filter(
            Q(uploaded_by__is_staff=True) | Q(uploaded_by__role__iexact="INSTRUCTOR")
        )
        # กรองเพิ่มด้วย query params (option)
        instructor_id = self.request.query_params.get("instructor_id")
        if instructor_id:
            qs = qs.filter(uploaded_by_id=instructor_id)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs.order_by("-created_at")

    @action(
        detail=True,
        methods=["get"],
        url_path="download",
        permission_classes=[permissions.IsAuthenticated],
    )
    def download(self, request, pk=None):
        doc = self.get_object()
        if not doc.file:
            raise Http404("File not found")

        # ใช้ชื่อเดิมถ้ามี, ไม่งั้น fallback เป็นชื่อในสตอเรจ
        filename = getattr(doc, "original_filename", None) or Path(doc.file.name).name
        # รวมสระให้เป็นรูปแบบเดียว (กันสระขาด)
        filename = unicodedata.normalize("NFC", filename)

        try:
            # Django 4+ จะส่ง header ให้ครบเอง (รวม UTF-8)
            return FileResponse(
                doc.file.open("rb"), as_attachment=True, filename=filename
            )
        except TypeError:
            # Fallback: ใส่ทั้ง filename (ascii) และ filename* (utf-8)
            resp = FileResponse(doc.file.open("rb"), as_attachment=True)
            resp["Content-Disposition"] = (
                f"attachment; filename*=UTF-8''{quote(filename)}"
            )
            return resp


# src/lms_app/views.py
class UniversitiesStaffOrganizationListViewSet(viewsets.ModelViewSet):
    serializer_class = UniversitySerializer  # fields: id, name, created_at เท่านั้น
    permission_classes = [IsUniversityAdmin]  # ให้เฉพาะแอดมินของมหาลัยแก้ไขได้
    queryset = University.objects.all().order_by("name")

    def get_queryset(self):
        qs = super().get_queryset()
        # แนะนำ: จำกัดให้เห็นเฉพาะมหาวิทยาลัยของตัวเอง
        if not self.request.user.is_staff and not self.request.user.is_superuser:
            qs = qs.filter(id=self.request.user.university_id)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs

        # ถ้าต้องการให้ staff เห็นเฉพาะ “มหาวิทยาลัยตัวเอง” ให้ใช้แทน:
        # return qs.filter(id=self.request.user.university_id)


class AdminOrganizationListViewSet(viewsets.ModelViewSet):
    """
    สำหรับแอดมินระบบ (is_staff): ดูรายการองค์กรทั้งหมด
    GET /api/admin/listorganizations/
    """

    serializer_class = UniversitySerializer
    permission_classes = [IsStaffAdmin]
    queryset = University.objects.all().order_by("name")

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q))  # ลบ email_domain ออก
        return qs


class LoginView(TokenObtainPairView):
    @extend_schema(
        request=LoginSerializer,
        responses=TokenPairSerializer,
        tags=["Auth"],
        summary="Login and return {access, refresh} (SimpleJWT)",
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class CurriculumViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only endpoints for listing/retrieving curricula.
    """

    queryset = Curriculum.objects.all().order_by("name")
    serializer_class = CurriculumSerializer
    permission_classes = [permissions.AllowAny]  # หรือกำหนดให้เฉพาะผู้ล็อกอินก็ได้


class CourseLevelChoicesAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        # สมมติ model.Course.level = models.CharField(choices=CourseLevel.choices, ...)
        data = []
        # ถ้าเป็น enum แบบ Django choices จะหน้าตาประมาณ [(value, label), ...]
        for value, label in Course._meta.get_field("level").choices:
            data.append(
                {
                    "id": value,  # ใช้เป็น value ที่ FE ส่งกลับ
                    "name": label,  # แสดงผล
                    "slug": value,  # เผื่อใช้งาน
                }
            )
        return Response(data, status=200)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CourseMaterialViewSet(viewsets.ModelViewSet):
    queryset = CourseMaterial.objects.all().order_by("-created_at")
    serializer_class = CourseMaterialSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["chapter", "type"]  # ✅ ใช้ 'type' ให้ตรงกับโมเดล/serializer
    search_fields = ["title"]  # (ถ้ามี field ชื่อ title)
    ordering_fields = ["created_at", "id"]

    def get_queryset(self):
        qs = super().get_queryset()
        # (จะคงบล็อกกรองด้วย query param เดิมไว้ก็ได้ ไม่ผิด)
        chapter_id = self.request.query_params.get("chapter")
        if chapter_id:
            qs = qs.filter(chapter_id=chapter_id)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class CourseMaterialUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request, *args, **kwargs):
        ser = CourseMaterialUploadSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        mat = ser.save()
        # response ให้ FE เอา url ไปใช้ได้

        path = mat.path
        url = settings.MEDIA_URL + path if not str(path).startswith("http") else path
        return Response(
            {
                "id": str(mat.id),
                "chapter": str(mat.chapter_id),
                "title": mat.title,
                "type": mat.type,
                "path": path,
                "url": url,
            },
            status=status.HTTP_201_CREATED,
        )


class CourseQuizView(APIView):
    permission_classes = [IsAuthenticated, IsCourseInstructor]
    parser_classes = [JSONParser]

    def get_course(self, course_id):
        return get_object_or_404(Course, id=course_id)

    def get(self, request, course_id):
        course = self.get_course(course_id)
        quiz = getattr(course, "quiz", None)
        if not quiz:
            return Response(
                {"id": None, "course": str(course.id), "title": "", "questions": []},
                status=200,
            )
        return Response(QuizSer(quiz).data, status=200)

    @extend_schema(
        request=QuizSer,  # บอกสคีมาว่า POST รับอะไร
        responses={201: QuizSer, 200: QuizSer},  # ตอบกลับเป็นอะไร
        summary="Create course quiz (first time)",
    )
    def post(self, request, course_id):
        course = self.get_course(course_id)
        if hasattr(course, "quiz"):
            return Response(
                {"detail": "Quiz already exists. Use PUT to update."}, status=400
            )
        ser = QuizSer(data=request.data, context={"course": course})
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return Response(QuizSer(obj).data, status=201)

    @extend_schema(
        request=QuizSer,
        responses={200: QuizSer, 201: QuizSer},
        summary="Upsert/replace the whole quiz",
    )
    def put(self, request, course_id):
        course = self.get_course(course_id)
        quiz = getattr(course, "quiz", None)
        if not quiz:
            ser = QuizSer(data=request.data, context={"course": course})
            ser.is_valid(raise_exception=True)
            obj = ser.save()
            return Response(QuizSer(obj).data, status=201)
        ser = QuizSer(quiz, data=request.data)
        ser.is_valid(raise_exception=True)
        obj = ser.save()
        return Response(QuizSer(obj).data, status=200)


class CourseCertificateViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["list"]:
            return CertificateSerializer
        if self.action in ["issue"]:
            return CertificateIssueRequest
        if self.action in ["template", "save_and_issue"]:
            # GET template -> ใช้ TemplateSerializer; POST save-and-issue -> ใช้ SaveAndIssueRequest
            return (
                SaveAndIssueRequest
                if self.action == "save_and_issue"
                else CertificateTemplateSerializer
            )
        return CertificateSerializer

    # GET /courses/{course_id}/certificates/
    def list(self, request, course_id=None):
        course = get_object_or_404(Course, pk=course_id)
        if request.user.id == course.instructor_id:
            qs = Certificate.objects.filter(course=course).select_related(
                "student", "course"
            )
        else:
            qs = Certificate.objects.filter(course=course, student=request.user)
        ser = CertificateSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    # GET/PUT/PATCH /courses/{course_id}/certificates/template/
    @action(
        detail=False,
        methods=["get", "put", "patch"],
        url_path="template",
        permission_classes=[permissions.IsAuthenticated, IsCourseInstructor],
    )
    def template(self, request, course_id=None):
        course = get_object_or_404(Course, pk=course_id)
        tpl, _ = CertificateTemplate.objects.get_or_create(course=course)
        if request.method in ["PUT", "PATCH"]:
            ser = CertificateTemplateSerializer(
                tpl, data=request.data, partial=(request.method == "PATCH")
            )
            ser.is_valid(raise_exception=True)
            obj = ser.save(updated_by=request.user)
            return Response(CertificateTemplateSerializer(obj).data)
        # GET
        return Response(CertificateTemplateSerializer(tpl).data)

    @action(
    detail=False, methods=["post"], url_path="issue",
    permission_classes=[permissions.IsAuthenticated, IsCourseInstructor],
    )
    def issue(self, request, course_id=None):
        course = get_object_or_404(Course, pk=course_id)
        payload = CertificateIssueRequest(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        created = []
        
        def _issue_for(student_id):
            # กันออกซ้ำ
            if Certificate.objects.filter(course=course, student_id=student_id).exists():
                return None
            try:
                student_obj = User.objects.get(pk=student_id)
            except User.DoesNotExist:
                return None
            return _create_and_render_certificate(course=course, student=student_obj, actor=request.user)

        if data.get("issue_for_student_ids"):
            for sid in data["issue_for_student_ids"]:
                c = _issue_for(sid)
                if c:
                    created.append(c.id)
        elif data.get("issue_for_all_enrolled"):
            enrolled_qs = Enrollment.objects.filter(course=course)
            if data.get("issue_for_completed_only", True):
                enrolled_qs = enrolled_qs.filter(status=EnrollmentStatus.COMPLETED)
            for e in enrolled_qs.only("student_id"):
                c = _issue_for(e.student_id)
                if c:
                    created.append(c.id)
        else:
            return Response({"detail": "no target specified"}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"created": created}, status=status.HTTP_201_CREATED)

    # POST /api/courses/{course_id}/certificates/save-and-issue/
    @action(
    detail=False, methods=["post"], url_path="save-and-issue",
    permission_classes=[permissions.IsAuthenticated, IsCourseInstructor],
    )
    def save_and_issue(self, request, course_id=None):
        """
        1) อัปเดตเทมเพลต (partial) — กรองเฉพาะฟิลด์เทมเพลต
        2) ออกใบจริง (รายชื่อ/ทั้งคลาส/เฉพาะจบ) โดยเรียก helper เดียว
        3) คืนลิสต์ Certificate ของคอร์สให้ FE ใช้ได้ทันที
        """
        course = get_object_or_404(Course, pk=course_id)

        # (1) บันทึกเทมเพลต: กรองคีย์ก่อน
        template_fields = {"style", "primary_color", "secondary_color", "course_title_override", "issuer_name"}
        template_data = {k: v for k, v in request.data.items() if k in template_fields}

        tpl, _ = CertificateTemplate.objects.get_or_create(course=course)
        tpl_ser = CertificateTemplateSerializer(tpl, data=template_data, partial=True)
        tpl_ser.is_valid(raise_exception=True)
        tpl_ser.save(updated_by=getattr(request, "user", None))

        # (2) เตรียม payload ออกใบ
        issue_payload = {
            "issue_for_student_ids": request.data.get("issue_for_student_ids"),
            "issue_for_all_enrolled": request.data.get("issue_for_all_enrolled", False),
            "issue_for_completed_only": request.data.get("issue_for_completed_only", True),
        }
        payload = CertificateIssueRequest(data=issue_payload)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        def _issue_for(student_id):
            if Certificate.objects.filter(course=course, student_id=student_id).exists():
                return None
            try:
                student = User.objects.get(pk=student_id)
            except User.DoesNotExist:
                return None
            return _create_and_render_certificate(course=course, student=student, actor=request.user)

        if data.get("issue_for_student_ids"):
            for sid in data["issue_for_student_ids"]:
                _issue_for(sid)
        elif data.get("issue_for_all_enrolled"):
            qs = Enrollment.objects.filter(course=course)
            if data.get("issue_for_completed_only", True):
                qs = qs.filter(status=EnrollmentStatus.COMPLETED)
            for sid in qs.values_list("student_id", flat=True):
                _issue_for(sid)
        # else: ไม่ระบุ target -> เซฟเทมเพลตอย่างเดียว ไม่ออกใบ

        # (3) คืนลิสต์ certificate ปัจจุบันทั้งหมดของคอร์ส
        qs = Certificate.objects.filter(course=course).select_related("student", "course")
        return Response(CertificateSerializer(qs, many=True, context={"request": request}).data, status=status.HTTP_200_OK)
    
class CertificateRenderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, cert_id):
        try:
            cert = Certificate.objects.get(id=cert_id)
        except Certificate.DoesNotExist:
            return Response({"error": "Certificate not found"}, status=404)

        pdf_bytes = render_certificate_pdf(cert)

        filename = f"{cert.serial_no}.pdf"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

def _gen_serial():
    return f"WHP-{timezone.now():%Y}-{secrets.token_hex(3).upper()}"

def _gen_verification_code():
    return secrets.token_hex(16)

def _create_and_render_certificate(course, student, actor):
    # ป้องกันออกใบซ้ำ
    if Certificate.objects.filter(course=course, student=student).exists():
        return None

    tpl = getattr(course, "certificate_template", None)

    cert = Certificate.objects.create(
        student=student,
        course=course,
        template=tpl,

        serial_no=_gen_serial(),
        verification_code=_gen_verification_code(),

        instructor_name=(tpl.issuer_name if tpl and tpl.issuer_name else course.instructor.full_name),
        student_name=student.full_name,
        course_name=(tpl.course_title_override or course.title) if tpl else course.title,

        completion_date=timezone.now().date(),
        created_by=actor,
        render_status="pending",
    )

    try:
        render_and_attach_pdf(cert)
        cert.render_status = "done"
        cert.render_error = ""
    except Exception as e:
        cert.render_status = "failed"
        cert.render_error = str(e)[:2000]

    cert.save(update_fields=["file", "render_status", "render_error"])
    return cert

class StudentListAPIView(APIView):
    permission_classes = [IsAuthenticated]  # ใครเรียกได้กำหนดตามต้องการ

    def get(self, request):
        students = User.objects.filter(role=RoleChoices.STUDENT)
        data = [
            {
                "id": str(u.id),
                "name": u.full_name or u.email
            }
            for u in students
        ]
        return Response(data)
    
class InstructorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ดึง user ที่ role = INSTRUCTOR ทั้งหมด (ไม่กรอง university)
        qs = User.objects.filter(role=RoleChoices.INSTRUCTOR)

        data = [
            {
                "id": str(u.id),
                "name": u.full_name or u.email or "ไม่ทราบชื่อผู้สอน",
            }
            for u in qs
        ]
        return Response(data, status=status.HTTP_200_OK)
