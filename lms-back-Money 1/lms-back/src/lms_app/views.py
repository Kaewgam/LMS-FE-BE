from django.shortcuts import render
from rest_framework import viewsets, permissions, status, mixins, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
import requests

from .models import *

from .serializers import *
from .serializers import UserMeSerializer, UserDetailsSerializer
from .permissions import *

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from django.db.models import Max, Count, Q
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.exceptions import PermissionDenied
from rest_framework import serializers

from drf_spectacular.utils import extend_schema, OpenApiParameter, extend_schema_view
from drf_spectacular.types import OpenApiTypes

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from dj_rest_auth.views import UserDetailsView

from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .models import ImportantDocument
from .serializers import ImportantDocumentSerializer
from django.http import FileResponse, Http404
from pathlib import Path
import unicodedata
from urllib.parse import quote

# Create your views here.


class UserMeView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user


class InstructorMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserMeSerializer(request.user, context={"request": request}).data
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
    permission_classes = [IsAuthenticated]
    serializer_class = EducationSerializer

    def get_queryset(self):
        # สำคัญ: กันตอน spectacular สร้าง schema
        if getattr(self, "swagger_fake_view", False):
            return MyEducation.objects.none()

        user = self.request.user
        # ตรวจ user ให้ชัดเจน
        if not user or not user.is_authenticated:
            return MyEducation.objects.none()
        return MyEducation.objects.filter(user_id=user.id)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)  # ⬅️ สร้างใหม่ค่อยผูก user

    def perform_update(self, serializer):
        # ⬅️ ห้ามเปลี่ยนเจ้าของ และไม่ต้อง set user ซ้ำตอนแก้ไข
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Not your education record")
        serializer.save()


class MyTeachingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TeachingSerializer

    def get_queryset(self):
        return TeachingExperience.objects.filter(user=self.request.user).order_by(
            "-start_year"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise PermissionDenied("Not your teaching record")
        serializer.save()


class InstructorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        profile, _ = InstructorProfile.objects.get_or_create(user=request.user)
        profile.motto = request.data.get("motto", "") or ""
        profile.save(update_fields=["motto"])
        return Response({"motto": profile.motto}, status=status.HTTP_200_OK)


class MeView(UserDetailsView):
    serializer_class = UserDetailsSerializer

    # (ปกติ UserDetailsView ใส่ context ให้แล้ว แต่ใส่ให้ชัดไว้ก็ได้)
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


@method_decorator(csrf_exempt, name="dispatch")
class GoogleTokenLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"detail": "Missing 'access_token'."}, status=400)

        try:
            # 1) เรียก Google UserInfo จาก access_token
            #    (ต้องได้ email, sub, picture ฯลฯ)
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
            # ค่าที่สำคัญ
            sub = info.get("sub")  # google user id
            email = info.get("email")
            email_verified = info.get("email_verified", False)
            full_name = info.get("name") or info.get("given_name") or ""
            picture = info.get("picture")

            if not email:
                return Response({"detail": "Google did not return email."}, status=400)

            # 2) หา/สร้างผู้ใช้ในระบบ
            user, created = User.objects.get_or_create(
                email=email, defaults={"full_name": full_name}
            )
            # อัปเดตชื่อ/รูป (ถ้ามี)
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

            # 3) ออก JWT
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
            # 4) จัดการ membership/invitation ตามลอจิกเดิม
            try:
                with transaction.atomic():
                    if user.university_id:
                        # ใช้ role ที่ “ล็อคไว้ที่ user” เป็นค่าเริ่มต้น
                        defaults_role = (
                            getattr(user, "role", None) or RoleChoices.STUDENT
                        )
                        member, created = UniversityMember.objects.get_or_create(
                            user=user,
                            university=user.university,
                            defaults={"role": defaults_role},
                        )
                        # ถ้ามีอยู่แล้วและ role บน member ไม่ตรงกับ user.role ให้ sync ให้ตรง (ถ้าต้องการ)
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
        # staff/superuser สามารถทำได้ทุกอย่าง
        # แต่ถ้าเป็น action ที่ต้องใช้สิทธิ์ระดับมหาลัย (เช่น invite insturctof) ให้ใช้ IsUniversityAdmin
        if self.action in ["invite_instructor", "members"]:
            permission_classes = [IsUniversityAdmin]
        elif self.action == "curriculums":
            if self.request.method == "GET":
                permission_classes = [IsUniversityMember]
            else:
                permission_classes = [IsUniversityAdmin]
        else:
            permission_classes = [
                permissions.IsAdminUser
            ]  # IsAdminUser คือ is_staff=True

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
    @action(detail=True, methods=["get", "post"], url_path="members")
    def members(self, request, pk=None):
        course = self.get_object()

        if request.method.lower() == "post":
            perm = IsCourseOwnerOrAdmin()
            if not perm.has_object_permission(request, self, course):
                raise PermissionDenied("Only course owner or admin can manage members.")

            student_id = request.data.get("student_id")
            if not student_id:
                return Response({"detail": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

            is_member = UniversityMember.objects.filter(
                user=student, university=course.university, role=RoleChoices.STUDENT
            ).exists()
            if not is_member:
                return Response(
                    {"detail": "Student is not in this university."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={"status": EnrollmentStatus.ENROLLED},
            )
            if not created:
                return Response(
                    {"detail": "Student already enrolled in this course."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        enrollments = Enrollment.objects.filter(course=course)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["delete"], url_path=r"members/(?P<enrollment_id>[^/.]+)")
    def delete_member(self, request, pk=None, enrollment_id=None):
        course = self.get_object()
        perm = IsCourseOwnerOrAdmin()
        if not perm.has_object_permission(request, self, course):
            raise PermissionDenied("Only course owner or admin can manage members.")

        enrollment = Enrollment.objects.filter(id=enrollment_id, course=course).first()
        if not enrollment:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class CourseViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing courses.
    - LIST/CREATE: /api/courses/
    - RETRIEVE/UPDATE/DELETE: /api/courses/{id}/
    - UPDATE STATUS: /api/courses/{id}/update-status/
    - MEMBERS: /api/courses/{id}/members/
    """
    queryset = Course.objects.all().select_related('instructor', 'curriculum', 'university').order_by('-created_at')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get_serializer_class(self):
        if self.action == 'update_status':
            return CourseStatusUpdateSerializer
        elif self.action in ['update', 'partial_update']:
            return CourseUpdateSerializer
        return CourseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        university_id = self.request.query_params.get('university_id')
        
        if university_id:
            queryset = queryset.filter(university_id=university_id)
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)
        
        return queryset

    def perform_create(self, serializer):
        # Auto-set instructor, university, and initial status
        user = self.request.user
        university = user.university
        
        if not university:
            raise serializers.ValidationError("You must be associated with a university to create a course.")
        
        serializer.save(
            instructor=user,
            university=university,
            status=CourseStatus.PENDING  # Default to pending for approval
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Custom endpoint to update only the course status
        Requires admin permission
        URL: PATCH /api/courses/{id}/update-status/
        Body: { "status": "active" | "denied" | "archived" }
        """
        course = self.get_object()
        serializer = CourseStatusUpdateSerializer(course, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        """
        Manage course members (enrollments)
        GET: List all enrollments for the course
        POST: Add a student to the course
        """
        course = self.get_object()

        if request.method.lower() == 'post':
            perm = IsCourseOwnerOrAdmin()
            if not perm.has_object_permission(request, self, course):
                raise PermissionDenied("Only course owner or admin can manage members.")

            student_id = request.data.get('student_id')
            if not student_id:
                return Response({"detail": "student_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check if student is a member of the same university
            is_member = UniversityMember.objects.filter(
                user=student, university=course.university, role=RoleChoices.STUDENT
            ).exists()
            if not is member:
                return Response(
                    {"detail": "Student is not in this university."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            enrollment, created = Enrollment.objects.get_or_create(
                student=student,
                course=course,
                defaults={"status": EnrollmentStatus.ENROLLED},
            )
            if not created:
                return Response(
                    {"detail": "Student already enrolled in this course."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = EnrollmentSerializer(enrollment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # GET request - list enrollments
        enrollments = Enrollment.objects.filter(course=course)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path=r'members/(?P<enrollment_id>[^/.]+)')
    def delete_member(self, request, pk=None, enrollment_id=None):
        """
        Remove a student from the course
        DELETE: /api/courses/{course_id}/members/{enrollment_id}/
        """
        course = self.get_object()
        perm = IsCourseOwnerOrAdmin()
        if not perm.has_object_permission(request, self, course):
            raise PermissionDenied("Only course owner or admin can manage members.")

        enrollment = Enrollment.objects.filter(id=enrollment_id, course=course).first()
        if not enrollment:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
    """
    API endpoint สำหรับจัดการ Chapters ของคอร์ส
    """

    queryset = CourseChapter.objects.all().order_by("position")
    serializer_class = CourseChapterSerializer
    permission_classes = [IsCourseOwner]

    def get_queryset(self):
        """
        Filter chapters ตาม 'course_id' ที่ส่งมาใน query parameter
        URL: /api/chapters/?course_id=<course_uuid>
        """
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course_id")
        if course_id:
            try:
                course = Course.objects.get(id=course_id)
                return queryset.filter(course=course)
            except Course.DoesNotExist:
                return queryset.none()
        return queryset.none()

    def perform_create(self, serializer):

        course = self.request.data.get("course")
        course = Course.objects.get(id=course, instructor=self.request.user)

        last_position = (
            CourseChapter.objects.filter(course=course).aggregate(Max("position"))[
                "position__max"
            ]
            or 0
        )
        serializer.save(course=course, position=last_position + 1)

    @extend_schema(
        summary="Reorder Chapters",
        description="Update the position of chapters by providing a list of their IDs in the new desired order.",
        request=ChapterReorderSerializer,  # บอก Swagger ว่า Body ควรจะมีหน้าตาแบบนี้
        responses={
            200: {"description": "Chapters reordered successfully."},
            400: {"description": "Invalid data provided."},
        },
    )
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, *args, **kwargs):
        """
        Endpoint สำหรับจัดลำดับ chapters ใหม่ทั้งหมด
        URL: POST /api/chapters/reorder/
        Body: { "ordered_ids": ["uuid_of_A", "uuid_of_D", "uuid_of_B", ...] }
        """
        ordered_ids = request.data.get("ordered_ids", [])
        if not ordered_ids:
            return Response(
                {"detail": "ordered_ids list is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                chapters = list(CourseChapter.objects.filter(id__in=ordered_ids))

                # ตรวจสอบสิทธิ์ก่อนเริ่มทำงาน
                if chapters and chapters[0].course.instructor != request.user:
                    return Response(
                        {"detail": "You do not have permission."},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # สร้าง mapping ของ id กับ object เพื่อลดการ query ใน loop
                chapter_map = {str(c.id): c for c in chapters}

                # อัปเดต position ของแต่ละ chapter ตามลำดับที่ส่งมา
                for index, chapter_id in enumerate(ordered_ids):
                    chapter = chapter_map.get(chapter_id)
                    if chapter:
                        chapter.position = index + 1

                CourseChapter.objects.bulk_update(chapters, ["position"])

            return Response(
                {"status": "Chapters reordered successfully"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            Q(uploaded_by__is_staff=True)
            | Q(uploaded_by__groups__name__iexact="instructor")
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
