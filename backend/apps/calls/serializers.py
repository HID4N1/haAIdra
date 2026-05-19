import json

from rest_framework import serializers
from .models import Call, AudioFile, PipelineJob
from apps.users.serializers import AgentSerializer


PIPELINE_STEPS = [
    PipelineJob.Step.TRANSCRIPTION,
    PipelineJob.Step.SENTIMENT,
    PipelineJob.Step.TOPICS,
    PipelineJob.Step.SCORING,
    PipelineJob.Step.SUMMARY,
]

STEP_LABELS = {
    PipelineJob.Step.TRANSCRIPTION: "Transcribing",
    PipelineJob.Step.SENTIMENT: "Analyzing sentiment",
    PipelineJob.Step.TOPICS: "Detecting topics",
    PipelineJob.Step.SCORING: "Scoring quality",
    PipelineJob.Step.SUMMARY: "Generating summary",
}


def pipeline_progress(job):
    if not job:
        return 0
    if job.status == PipelineJob.Status.DONE:
        return 100
    if job.status == PipelineJob.Status.FAILED:
        return 100
    if job.status == PipelineJob.Status.QUEUED:
        return 5
    if job.current_step in PIPELINE_STEPS:
        return int(((PIPELINE_STEPS.index(job.current_step) + 1) / len(PIPELINE_STEPS)) * 90)
    return 10


def pipeline_display(job, call_status=None):
    if not job:
        return "Queued" if call_status == Call.Status.PENDING else str(call_status or "Pending").title()
    if job.status == PipelineJob.Status.DONE:
        return "Completed"
    if job.status == PipelineJob.Status.FAILED:
        return "Failed"
    if job.status == PipelineJob.Status.QUEUED:
        return "Queued"
    return STEP_LABELS.get(job.current_step, "Processing")


class AudioFileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AudioFile
        fields = ["id", "s3_key", "s3_url", "checksum", "file_size", "created_at"]
        read_only_fields = fields


class PipelineJobSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    display_status = serializers.SerializerMethodField()

    class Meta:
        model  = PipelineJob
        fields = [
            "id", "status", "current_step",
            "retry_count", "error_message",
            "progress", "display_status",
            "started_at", "finished_at", "created_at",
        ]
        read_only_fields = fields

    def get_progress(self, obj):
        return pipeline_progress(obj)

    def get_display_status(self, obj):
        return pipeline_display(obj)


class CallListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for call list view."""
    agent = AgentSerializer(read_only=True)
    sentiment = serializers.SerializerMethodField()
    quality_score = serializers.SerializerMethodField()
    topics = serializers.SerializerMethodField()
    pipeline = serializers.SerializerMethodField()

    class Meta:
        model  = Call
        fields = [
            "id", "agent", "language", "channel",
            "file_format", "duration", "status",
            "is_flagged", "resolution_status",
            "sentiment", "quality_score", "topics",
            "pipeline",
            "uploaded_at", "created_at",
        ]
        read_only_fields = fields

    def get_sentiment(self, obj):
        sentiment = getattr(obj, "sentiment", None)
        return getattr(sentiment, "overall_label", None)

    def get_quality_score(self, obj):
        score = getattr(obj, "score", None)
        return getattr(score, "total", None)

    def get_topics(self, obj):
        topic = getattr(obj, "topic", None)
        topics = getattr(topic, "topics", []) or []
        return [
            item.get("label", item) if isinstance(item, dict) else item
            for item in topics
        ]

    def get_pipeline(self, obj):
        job = getattr(obj, "pipeline_job", None)
        return {
            "status": getattr(job, "status", None),
            "current_step": getattr(job, "current_step", None),
            "progress": pipeline_progress(job),
            "display_status": pipeline_display(job, obj.status),
            "retry_count": getattr(job, "retry_count", 0),
            "error_message": getattr(job, "error_message", ""),
        }


class CallSerializer(serializers.ModelSerializer):
    """Full serializer for call detail view."""
    agent        = AgentSerializer(read_only=True)
    audio_file   = AudioFileSerializer(read_only=True)
    pipeline_job = PipelineJobSerializer(read_only=True)

    class Meta:
        model  = Call
        fields = [
            "id", "company", "agent", "uploaded_by",
            "client_phone", "language", "channel",
            "file_format", "file_size", "duration",
            "status", "tags", "is_flagged",
            "resolution_status", "uploaded_at",
            "audio_file", "pipeline_job",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class CallUploadSerializer(serializers.ModelSerializer):
    """
    Used for POST /api/v1/calls/ — upload a new call.
    Accepts audio file + metadata.
    """
    audio = serializers.FileField(write_only=True)
    agent_id = serializers.UUIDField(write_only=True)

    class Meta:
        model  = Call
        fields = [
            "audio", "agent_id", "language",
            "channel", "client_phone", "tags",
        ]

    def validate_audio(self, file):
        allowed_formats = ["wav", "mp3", "m4a", "flac", "ogg"]
        ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
        if ext not in allowed_formats:
            raise serializers.ValidationError(
                f"Unsupported format. Allowed: {', '.join(allowed_formats)}"
            )
        return file

    def validate_agent_id(self, value):
        from apps.users.models import Agent
        request = self.context.get("request")
        qs = Agent.objects.all()
        if request and request.user.is_authenticated and not request.user.is_admin:
            qs = qs.filter(company=request.user.company)
        try:
            return qs.get(id=value)
        except Agent.DoesNotExist:
            raise serializers.ValidationError("Agent not found for your company.")

    def validate_tags(self, value):
        if value in ("", None):
            return []
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError:
                parsed = [item.strip() for item in value.split(",") if item.strip()]
            value = parsed
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list or comma-separated text.")
        return [str(item).strip() for item in value if str(item).strip()]


class CallUpdateSerializer(serializers.ModelSerializer):
    """Partial update — tags, flags, resolution status only."""
    class Meta:
        model  = Call
        fields = ["tags", "is_flagged", "resolution_status"]
