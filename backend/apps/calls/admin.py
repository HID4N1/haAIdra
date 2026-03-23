from django.contrib import admin
from .models import Call, AudioFile, PipelineJob


class AudioFileInline(admin.StackedInline):
    model       = AudioFile
    extra       = 0
    readonly_fields = ("id", "s3_key", "s3_url", "checksum", "file_size", "created_at")


class PipelineJobInline(admin.StackedInline):
    model       = PipelineJob
    extra       = 0
    readonly_fields = (
        "id", "status", "current_step",
        "retry_count", "error_message",
        "started_at", "finished_at", "created_at",
    )


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display    = (
        "id", "agent", "company", "status",
        "language", "channel", "is_flagged",
        "resolution_status", "uploaded_at",
    )
    list_filter     = (
        "status", "language", "channel",
        "is_flagged", "resolution_status", "company",
    )
    search_fields   = ("client_phone", "agent__user__email")
    readonly_fields = ("id", "uploaded_at", "created_at", "updated_at")
    ordering        = ("-uploaded_at",)
    inlines         = [AudioFileInline, PipelineJobInline]


@admin.register(AudioFile)
class AudioFileAdmin(admin.ModelAdmin):
    list_display    = ("id", "call", "s3_key", "file_size", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")
    search_fields   = ("s3_key", "call__id")


@admin.register(PipelineJob)
class PipelineJobAdmin(admin.ModelAdmin):
    list_display    = (
        "id", "call", "status", "current_step",
        "retry_count", "started_at", "finished_at",
    )
    list_filter     = ("status", "current_step")
    readonly_fields = ("id", "created_at", "updated_at")