from uuid import UUID
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Assignment, AssignmentAttachment
from .serializers import (
    AssignmentReadSerializer,
    AssignmentUpsertSerializer,
    AssignmentAttachmentSerializer,
)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related("course", "lesson", "instructor")
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return AssignmentReadSerializer
        return AssignmentUpsertSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback, sys
            print("\n[AssignmentViewSet.list] ERROR:", e, file=sys.stderr)
            traceback.print_exc()
            return Response(
                {"detail": "server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_queryset(self):
        qs = super().get_queryset()
        try:
            course_id = self.request.query_params.get("course")
            lesson_id = self.request.query_params.get("lesson")

            if course_id:
                try:
                    UUID(course_id)
                    qs = qs.filter(course_id=course_id)
                except (ValueError, TypeError):
                    pass

            if lesson_id:
                try:
                    UUID(lesson_id)
                    qs = qs.filter(lesson_id=lesson_id)
                except (ValueError, TypeError):
                    pass

            return qs
        except Exception as e:
            import traceback, sys
            print("\n[AssignmentViewSet.get_queryset] ERROR:", e, file=sys.stderr)
            traceback.print_exc()
            raise

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    # --------- ใช้ read-serializer ตอนตอบกลับ ---------
    def create(self, request, *args, **kwargs):
        try:
            # ใช้ AssignmentUpsertSerializer validate + save
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

            # แล้ว re-serialize ด้วย AssignmentReadSerializer (มี attachments)
            read_ser = AssignmentReadSerializer(
                serializer.instance, context={"request": request}
            )
            headers = self.get_success_headers(read_ser.data)
            return Response(
                read_ser.data, status=status.HTTP_201_CREATED, headers=headers
            )
        except Exception as e:
            import traceback, sys
            print("\n[AssignmentViewSet.create] ERROR:", e, file=sys.stderr)
            traceback.print_exc()
            return Response(
                {"detail": "server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        # ให้ทำงานเหมือน partial update เสมอ
        kwargs["partial"] = True
        try:
            partial = kwargs.pop("partial", False)
            instance = self.get_object()

            # ใช้ AssignmentUpsertSerializer validate + save
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            # re-serialize ด้วย AssignmentReadSerializer (คืน attachments ด้วย)
            read_ser = AssignmentReadSerializer(
                serializer.instance, context={"request": request}
            )
            return Response(read_ser.data)
        except Exception as e:
            import traceback, sys
            print("\n[AssignmentViewSet.update] ERROR:", e, file=sys.stderr)
            traceback.print_exc()
            return Response(
                {"detail": "server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    # ====== แนบไฟล์ทีหลัง (optional) ======
    @action(detail=True, methods=["post"])
    def attachments(self, request, pk=None):
        assn = self.get_object()
        files = request.FILES.getlist("files")
        bulk = []
        for f in files or []:
            bulk.append(
                AssignmentAttachment(
                    assignment=assn,
                    uploaded_by=request.user,
                    file=f,
                    original_name=getattr(f, "name", ""),
                    content_type=getattr(f, "content_type", "") or "",
                    title=getattr(f, "name", ""),
                )
            )
        if bulk:
            AssignmentAttachment.objects.bulk_create(bulk)
        data = AssignmentAttachmentSerializer(
            AssignmentAttachment.objects.filter(assignment=assn),
            many=True,
            context={"request": request},
        ).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path="attachments/(?P<file_id>[^/.]+)")
    def delete_attachment(self, request, pk=None, file_id=None):
        assn = self.get_object()
        AssignmentAttachment.objects.filter(assignment=assn, id=file_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
