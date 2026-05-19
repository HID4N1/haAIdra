import hashlib
import logging
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from core.mixins import TenantScopedMixin
from apps.users.permissions import IsManager, IsQASupervisor, IsAgent
from .models import Call, AudioFile, PipelineJob
from .serializers import (
    CallSerializer, CallListSerializer,
    CallUploadSerializer, CallUpdateSerializer,
    PipelineJobSerializer, pipeline_display, pipeline_progress,
)
from .filters import CallFilter
from .storage import s3_storage

logger = logging.getLogger(__name__)


class CallViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    GET    /api/v1/calls/          — list calls (tenant scoped)
    POST   /api/v1/calls/          — upload new call
    GET    /api/v1/calls/{id}/     — call detail
    PATCH  /api/v1/calls/{id}/     — update tags / flags / resolution
    DELETE /api/v1/calls/{id}/     — soft delete call
    GET    /api/v1/calls/{id}/status/ — pipeline job status
    """
    queryset = Call.objects.select_related(
                           "agent", "company", "uploaded_by",
                           "audio_file", "pipeline_job",
                           "sentiment", "score", "topic"
                       ).all()
    filterset_class  = CallFilter
    search_fields    = ["client_phone", "agent__user__email", "tags"]
    ordering_fields  = ["uploaded_at", "duration", "status"]
    ordering        = ["-uploaded_at"]
    parser_classes  = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ("destroy",):
            return [IsManager()]
        return [IsAgent()]

    def get_serializer_class(self):
        if self.action == "list":
            return CallListSerializer
        if self.action == "create":
            return CallUploadSerializer
        if self.action in ("update", "partial_update"):
            return CallUpdateSerializer
        return CallSerializer

    def create(self, request, *args, **kwargs):
        serializer = CallUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        audio      = serializer.validated_data["audio"]
        agent      = serializer.validated_data["agent_id"]  
        language   = serializer.validated_data.get("language", "fr")
        channel    = serializer.validated_data.get("channel", "inbound")
        client_phone = serializer.validated_data.get("client_phone", "")
        tags       = serializer.validated_data.get("tags", [])

        # Build S3 key
        ext     = audio.name.split(".")[-1].lower()
        call    = Call.objects.create(
            company=request.user.company,
            agent=agent,
            uploaded_by=request.user,
            language=language,
            channel=channel,
            client_phone=client_phone,
            file_format=ext,
            file_size=audio.size,
            tags=tags,
            status=Call.Status.PENDING,
        )

        # Upload to S3
        s3_key = s3_storage.build_s3_key(
            request.user.company.tenant_id, call.id, audio.name
        )
        s3_storage.upload_file(audio, s3_key, content_type=audio.content_type)
        s3_url = s3_storage.generate_presigned_url(s3_key)

        # Compute checksum
        audio.seek(0)
        checksum = hashlib.md5(audio.read()).hexdigest()

        # Store AudioFile
        AudioFile.objects.create(
            call=call,
            s3_key=s3_key,
            s3_url=s3_url,
            checksum=checksum,
            file_size=audio.size,
        )

        # Create PipelineJob
        job = PipelineJob.objects.create(call=call)

        # Trigger Celery task
        try:
            from apps.analysis.tasks import trigger_analysis
            trigger_analysis.delay(str(call.id))
            job.status = PipelineJob.Status.QUEUED
            job.save(update_fields=["status", "updated_at"])
        except Exception as e:
            logger.error("Failed to trigger analysis for call %s: %s", call.id, e)
            job.status = PipelineJob.Status.FAILED
            job.error_message = "Analysis could not be queued. Please retry."
            job.finished_at = timezone.now()
            job.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
            call.status = Call.Status.FAILED
            call.save(update_fields=["status", "updated_at"])

        return Response(
            CallSerializer(call).data,
            status=status.HTTP_202_ACCEPTED,
        )

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=True, methods=["get"], url_path="status")
    def pipeline_status(self, request, pk=None):
        """GET /api/v1/calls/{id}/status/ — get pipeline job status."""
        call = self.get_object()
        try:
            job = call.pipeline_job
        except PipelineJob.DoesNotExist:
            return Response(
                {"detail": "No pipeline job found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = PipelineJobSerializer(job).data
        data.update({
            "call_id": str(call.id),
            "call_status": call.status,
            "progress": pipeline_progress(job),
            "display_status": pipeline_display(job, call.status),
            "is_terminal": call.status in (Call.Status.ANALYZED, Call.Status.FAILED)
            or job.status in (PipelineJob.Status.DONE, PipelineJob.Status.FAILED),
        })
        return Response(data)

    @action(detail=True, methods=["post"], url_path="flag",
            permission_classes=[IsQASupervisor])
    def flag(self, request, pk=None):
        """POST /api/v1/calls/{id}/flag/ — toggle flag on a call."""
        call = self.get_object()
        call.is_flagged = not call.is_flagged
        call.save(update_fields=["is_flagged", "updated_at"])
        return Response({"is_flagged": call.is_flagged})
