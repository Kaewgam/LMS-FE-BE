from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Scoring, Course
from .serializers import ScoringSerializer
from .permissions import IsCourseInstructor
from drf_spectacular.utils import extend_schema, OpenApiResponse
from django.shortcuts import get_object_or_404


class CourseScoringView(APIView):
    """
    GET    /api/courses/<course_id>/scoring/
    POST   /api/courses/<course_id>/scoring/
    PUT    /api/courses/<course_id>/scoring/
    PATCH  /api/courses/<course_id>/scoring/
    DELETE /api/courses/<course_id>/scoring/
    """
    permission_classes = [IsAuthenticated, IsCourseInstructor]

    def get_course(self, course_id):
        return get_object_or_404(Course, id=course_id)

    @extend_schema(
        responses={200: ScoringSerializer},
        description="ดึงเกณฑ์ (ถ้ายังไม่มีจะคืนโครงว่าง)"
    )
    def get(self, request, course_id):
        scoring = Scoring.objects.filter(course_id=course_id).first()
        if not scoring:
            return Response({
                "id": None,
                "course": str(course_id),
                "pass_score": 0,
                "items": []
            })
        ser = ScoringSerializer(scoring)
        return Response(ser.data)

    @extend_schema(
        request=ScoringSerializer,                # ⭐ บอกว่า POST ต้องส่ง body ตาม ScoringSerializer
        responses={201: ScoringSerializer, 400: OpenApiResponse(description="Already exists / validation error")},
        description="สร้างชุดเกณฑ์ (ครั้งแรก)"
    )
    def post(self, request, course_id):
        if Scoring.objects.filter(course_id=course_id).exists():
            return Response({"detail": "Scoring already exists. Use PUT to update."},
                            status=status.HTTP_400_BAD_REQUEST)
        course = self.get_course(course_id)
        ser = ScoringSerializer(data=request.data, context={"course": course})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=ScoringSerializer,                # ⭐ PUT มี body เช่นกัน
        responses={200: ScoringSerializer},
        description="อัปเดตแทนที่ทั้งชุด (ซิงก์ items)"
    )
    def put(self, request, course_id):
        course = self.get_course(course_id)
        scoring, _ = Scoring.objects.get_or_create(course=course, defaults={"pass_score": 0})
        ser = ScoringSerializer(scoring, data=request.data, context={"course": course})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    @extend_schema(
        request=ScoringSerializer,                # ⭐ PATCH ก็ใส่ request body
        responses={200: ScoringSerializer, 404: OpenApiResponse(description="Not found")},
        description="อัปเดตบางฟิลด์ (ถ้าจะซิงก์ items ให้ส่งทั้งชุด)"
    )
    def patch(self, request, course_id):
        course = self.get_course(course_id)
        scoring = Scoring.objects.filter(course=course).first()
        if not scoring:
            return Response({"detail": "Scoring not found."}, status=status.HTTP_404_NOT_FOUND)
        ser = ScoringSerializer(scoring, data=request.data, partial=True, context={"course": course})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    @extend_schema(
        responses={204: OpenApiResponse(description="Deleted")},
        description="ลบเกณฑ์ทั้งชุด"
    )
    def delete(self, request, course_id):
        Scoring.objects.filter(course_id=course_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)