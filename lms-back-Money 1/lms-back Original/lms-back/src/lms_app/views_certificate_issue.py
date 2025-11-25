# lms_app/views_certificate_issue.py
import random
import string

from django.utils import timezone
from django.http import FileResponse, Http404

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.negotiation import BaseContentNegotiation  # << เพิ่ม
# ^^^ อย่าใช้ IgnoreClientContentNegotiation (บางเวอร์ชันไม่มี)

from .models import (
    Course,
    Enrollment,
    Certificate,
    CertificateTemplate,
    EnrollmentStatus,
)

# ---------- content negotiation: เพิกเฉย Accept header ----------
class IgnoreAcceptNegotiation(BaseContentNegotiation):
    """
    DRF จะเรียก class นี้ก่อนเข้า view
    เราเลือก renderer แรกเสมอ (เช่น JSONRenderer) เพื่อกัน 406
    แม้ฝั่ง FE จะส่ง Accept: application/pdf มาก็ตาม
    """
    def select_parser(self, request, parsers):
        return parsers[0] if parsers else None

    def select_renderer(self, request, renderers, format_suffix=None):
        renderer = renderers[0] if renderers else None
        media_type = getattr(renderer, "media_type", "application/json")
        return renderer, media_type


# -- lazy import เพื่อหลีกเลี่ยงวงจร import --
def _render_pdf(data: dict, filename: str):
    from .cert_pdf_renderer import render_certificate_pdf
    return render_certificate_pdf(data=data, filename=filename)


# ---------- helpers ----------
def _gen_serial_no() -> str:
    today = timezone.now().strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"CERT-{today}-{suffix}"

def _gen_verification_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=12))


# ---------- Template GET/PUT ----------
class CertificateTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404("Course not found")

        tpl = CertificateTemplate.objects.filter(course=course).first()
        if not tpl:
            return Response({
                "style": "classic",
                "primary_color": "#881337",
                "secondary_color": "#1f2937",
                "course_title_override": None,
                "issuer_name": "",
                "locale": "th",
            })

        return Response({
            "style": tpl.style,
            "primary_color": tpl.primary_color,
            "secondary_color": tpl.secondary_color,
            "course_title_override": tpl.course_title_override,
            "issuer_name": tpl.issuer_name,
            "locale": tpl.locale,
        })

    def put(self, request, course_id):
        return self._save(request, course_id)

    def patch(self, request, course_id):
        return self._save(request, course_id)

    def _save(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404("Course not found")

        style = request.data.get("style", "classic")
        primary = request.data.get("primary_color", "#881337")
        secondary = request.data.get("secondary_color", "#1f2937")
        course_title_override = request.data.get("course_title_override")
        issuer_name = request.data.get("issuer_name", "")
        locale = request.data.get("locale", "th")

        tpl, _ = CertificateTemplate.objects.update_or_create(
            course=course,
            defaults={
                "style": style,
                "primary_color": primary,
                "secondary_color": secondary,
                "course_title_override": course_title_override,
                "issuer_name": issuer_name,
                "locale": locale,
                "updated_by": request.user,
            },
        )
        return Response({
            "style": tpl.style,
            "primary_color": tpl.primary_color,
            "secondary_color": tpl.secondary_color,
            "course_title_override": tpl.course_title_override,
            "issuer_name": tpl.issuer_name,
            "locale": tpl.locale,
        }, status=status.HTTP_200_OK)


# ---------- Preview PDF ----------
class CertificatePreviewAPIView(APIView):
    permission_classes = [IsAuthenticated]
    # กัน 406 เวลา FE ส่ง Accept: application/pdf
    content_negotiation_class = IgnoreAcceptNegotiation

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404("Course not found")

        tpl = CertificateTemplate.objects.filter(course=course).first()
        style = tpl.style if tpl else "classic"
        primary = tpl.primary_color if tpl else "#881337"
        secondary = tpl.secondary_color if tpl else "#1f2937"
        course_title = (tpl.course_title_override if (tpl and tpl.course_title_override) else course.title)
        issuer = tpl.issuer_name if tpl else ""

        data = {
            "student_name": "ตัวอย่างผู้เรียน",
            "course_name": course_title,
            "instructor_name": issuer or (
                course.instructor.full_name if getattr(course, "instructor", None) else ""
            ),
            "completion_date": timezone.now().strftime("%d/%m/%Y"),
            "primary_color": primary,
            "secondary_color": secondary,
            "style": style,
        }

        content = _render_pdf(data, filename="preview.pdf")
        resp = FileResponse(content, content_type="application/pdf")
        resp["Content-Disposition"] = 'inline; filename="preview.pdf"'
        return resp


# ---------- Issue certificates ----------
class IssueCertificates(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            raise Http404("Course not found")

        tpl = CertificateTemplate.objects.filter(course=course).first()
        style = tpl.style if tpl else "classic"
        primary = tpl.primary_color if tpl else "#881337"
        secondary = tpl.secondary_color if tpl else "#1f2937"
        course_title = (tpl.course_title_override if (tpl and tpl.course_title_override) else course.title)
        issuer = (tpl.issuer_name if tpl else (
            course.instructor.full_name if getattr(course, "instructor", None) else ""
        ))

        enrolls = Enrollment.objects.filter(course=course, status=EnrollmentStatus.COMPLETED)

        output = []
        for en in enrolls:
            student = en.student

            cert, created = Certificate.objects.get_or_create(
                course=course,
                student=student,
                defaults={
                    "serial_no": _gen_serial_no(),
                    "verification_code": _gen_verification_code(),
                    "instructor_name": issuer,
                    "student_name": student.full_name,
                    "course_name": course_title,
                    "completion_date": timezone.now().date(),
                    "render_status": "pending",
                    "render_error": "",
                    "created_by": request.user,
                    "template": tpl if tpl else None,
                },
            )

            if not created:
                cert.instructor_name = issuer
                cert.student_name = student.full_name
                cert.course_name = course_title
                cert.completion_date = timezone.now().date()
                cert.render_status = "pending"
                cert.render_error = ""
                cert.template = tpl if tpl else None
                cert.save()

            data = {
                "student_name": cert.student_name,
                "course_name": cert.course_name,
                "instructor_name": cert.instructor_name,
                "completion_date": cert.completion_date.strftime("%d/%m/%Y"),
                "primary_color": primary,
                "secondary_color": secondary,
                "style": style,
            }

            pdf_file = _render_pdf(data=data, filename=f"cert_{cert.id}.pdf")
            cert.file.save(pdf_file.name, pdf_file)
            cert.render_status = "done"
            cert.render_error = ""
            cert.save()

            output.append({
                "certificate_id": str(cert.id),
                "pdf_url": cert.file.url if cert.file else None,
                "created": created,
            })

        return Response(output, status=status.HTTP_201_CREATED)


# ---------- Save template + issue ----------
class SaveTemplateAndIssue(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id):
        put_view = CertificateTemplateView()
        put_response = put_view._save(request, course_id)
        if put_response.status_code not in (200, 201):
            return put_response

        issue_view = IssueCertificates()
        return issue_view.post(request, course_id)
