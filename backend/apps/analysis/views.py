import logging
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from core.mixins import TenantScopedMixin
from apps.users.permissions import IsManager, IsQASupervisor, IsAgent
from apps.calls.models import Call, PipelineJob
from apps.calls.serializers import pipeline_display, pipeline_progress
from .models import Transcript, Sentiment, Topic, Score, Summary, QAReview
from .serializers import (
    AnalysisSerializer, QAReviewSerializer, QAReviewUpdateSerializer,
)

logger = logging.getLogger(__name__)


class AnalysisView(APIView):
    """
    GET /api/v1/calls/{id}/analysis/
    Returns full analysis payload for a call.
    Also used for polling — returns status if not yet analyzed.
    """
    permission_classes = [IsAgent]

    def get(self, request, call_id):
        try:
            call = Call.objects.select_related(
                "transcript", "sentiment", "topic",
                "score", "summary", "qa_review",
                "pipeline_job",
            ).get(id=call_id, company=request.user.company)
        except Call.DoesNotExist:
            return Response(
                {"detail": "Call not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        job = getattr(call, "pipeline_job", None)

        # Build full analysis payload
        data = {
            "call_id":     str(call.id),
            "status":      call.status,
            "job_status":  getattr(job, "status", None),
            "current_step": getattr(job, "current_step", None),
            "progress":    pipeline_progress(job),
            "display_status": pipeline_display(job, call.status),
            "retry_count": getattr(job, "retry_count", 0),
            "error":       getattr(job, "error_message", "") or None,
            "updated_at":   call.updated_at,
            "transcript": getattr(call, "transcript", None),
            "sentiment":  getattr(call, "sentiment",  None),
            "topic":      getattr(call, "topic",      None),
            "score":      getattr(call, "score",      None),
            "summary":    getattr(call, "summary",    None),
            "qa_review":  getattr(call, "qa_review",  None),
        }
        return Response(AnalysisSerializer(data).data)


class TriggerAnalysisView(APIView):
    """
    POST /api/v1/calls/{id}/analyze/
    Manually re-trigger the AI pipeline for a call.
    Manager+ only.
    """
    permission_classes = [IsManager]

    def post(self, request, call_id):
        try:
            call = Call.objects.get(id=call_id, company=request.user.company)
        except Call.DoesNotExist:
            return Response(
                {"detail": "Call not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        job = getattr(call, "pipeline_job", None)
        if call.status == Call.Status.PROCESSING or (
            job and job.status in (PipelineJob.Status.QUEUED, PipelineJob.Status.RUNNING)
        ):
            return Response(
                {"detail": "Analysis already in progress."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reset status
        call.status = Call.Status.PENDING
        call.save(update_fields=["status", "updated_at"])

        # Reset pipeline job
        try:
            job = call.pipeline_job
            job.status        = PipelineJob.Status.QUEUED
            job.current_step  = None
            job.error_message = ""
            job.retry_count   = 0
            job.started_at    = None
            job.finished_at   = None
            job.save(update_fields=[
                "status", "current_step", "error_message", "retry_count",
                "started_at", "finished_at", "updated_at",
            ])
        except PipelineJob.DoesNotExist:
            job = PipelineJob.objects.create(call=call)

        # Trigger Celery task
        try:
            from .tasks import trigger_analysis
            trigger_analysis.delay(str(call.id))
        except Exception as e:
            logger.error("Failed to trigger analysis for call %s: %s", call.id, e)

        return Response({
            "detail":  "Analysis triggered.",
            "call_id": str(call.id),
            "job_id":  str(job.id),
        })


class QAReviewViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    GET    /api/v1/reviews/          — list reviews (QA Supervisor+)
    GET    /api/v1/reviews/{id}/     — review detail
    PATCH  /api/v1/reviews/{id}/     — override score, approve/reject
    """
    permission_classes = [IsQASupervisor]
    queryset           = QAReview.objects.select_related(
                             "call", "reviewer"
                         ).all()
    tenant_field       = "call__company"

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return QAReviewUpdateSerializer
        return QAReviewSerializer

    def get_queryset(self):
        qs     = super().get_queryset()
        status = self.request.query_params.get("status")
        call_id = self.request.query_params.get("call")
        if status:
            qs = qs.filter(status=status)
        if call_id:
            qs = qs.filter(call_id=call_id)
        return qs.order_by("-created_at")

    def perform_update(self, serializer):
        serializer.save(
            reviewer=self.request.user,
            reviewed_at=timezone.now(),
        )
