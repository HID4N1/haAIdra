from django.contrib import admin
from .models import Transcript, Sentiment, Topic, Score, Summary, QAReview


@admin.register(Transcript)
class TranscriptAdmin(admin.ModelAdmin):
    list_display    = ("call", "language_detected", "word_error_rate", "duration", "created_at")
    search_fields   = ("call__id",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Sentiment)
class SentimentAdmin(admin.ModelAdmin):
    list_display    = ("call", "overall_label", "overall_score", "created_at")
    list_filter     = ("overall_label",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display    = ("call", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display    = ("call", "total", "ai_total", "scored_by", "created_at")
    list_filter     = ("scored_by",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Summary)
class SummaryAdmin(admin.ModelAdmin):
    list_display    = ("call", "created_at")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(QAReview)
class QAReviewAdmin(admin.ModelAdmin):
    list_display    = ("call", "reviewer", "status", "is_overridden",
                       "score_override", "reviewed_at")
    list_filter     = ("status", "is_overridden")
    search_fields   = ("call__id", "reviewer__email")
    readonly_fields = ("id", "created_at", "updated_at")
