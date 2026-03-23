from rest_framework import serializers
from .models import Call, AudioFile, PipelineJob
from apps.users.serializers import AgentSerializer


class AudioFileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AudioFile
        fields = ["id", "s3_key", "s3_url", "checksum", "file_size", "created_at"]
        read_only_fields = fields


class PipelineJobSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PipelineJob
        fields = [
            "id", "status", "current_step",
            "retry_count", "error_message",
            "started_at", "finished_at", "created_at",
        ]
        read_only_fields = fields


class CallListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for call list view."""
    agent = AgentSerializer(read_only=True)

    class Meta:
        model  = Call
        fields = [
            "id", "agent", "language", "channel",
            "file_format", "duration", "status",
            "is_flagged", "resolution_status",
            "uploaded_at", "created_at",
        ]
        read_only_fields = fields


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
        ext = file.name.split(".")[-1].lower()
        if ext not in allowed_formats:
            raise serializers.ValidationError(
                f"Unsupported format. Allowed: {', '.join(allowed_formats)}"
            )
        return file

    def validate_agent_id(self, value):
        from apps.users.models import Agent
        try:
            return Agent.objects.get(id=value)
        except Agent.DoesNotExist:
            raise serializers.ValidationError("Agent not found.")


class CallUpdateSerializer(serializers.ModelSerializer):
    """Partial update — tags, flags, resolution status only."""
    class Meta:
        model  = Call
        fields = ["tags", "is_flagged", "resolution_status"]