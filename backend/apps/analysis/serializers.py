from rest_framework import serializers
from .models import Transcript, Sentiment, Topic, Score, Summary, QAReview


class TranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Transcript
        fields = [
            "id", "call", "language_detected", "word_error_rate",
            "duration", "segments", "created_at", "updated_at",
        ]
        read_only_fields = fields


class SentimentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sentiment
        fields = [
            "id", "call", "overall_label", "overall_score",
            "segments", "created_at", "updated_at",
        ]
        read_only_fields = fields


class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Topic
        fields = ["id", "call", "topics", "created_at", "updated_at"]
        read_only_fields = fields


class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Score
        fields = [
            "id", "call", "config",
            "accueil", "accueil_max",
            "empathie", "empathie_max",
            "resolution", "resolution_max",
            "langage", "langage_max",
            "conformite", "conformite_max",
            "cloture", "cloture_max",
            "total", "ai_total", "scored_by",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class SummarySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Summary
        fields = [
            "id", "call", "motif", "actions",
            "outcome", "recommendations",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class QAReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QAReview
        fields = [
            "id", "call", "reviewer",
            "score_override", "original_ai_score",
            "is_overridden", "override_reason",
            "comment", "status", "reviewed_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "call", "original_ai_score",
                            "is_overridden", "created_at", "updated_at"]


class QAReviewUpdateSerializer(serializers.ModelSerializer):
    """QA Supervisor can override score, add comment, approve/reject."""
    class Meta:
        model  = QAReview
        fields = ["score_override", "override_reason", "comment", "status"]

    def validate(self, attrs):
        if attrs.get("score_override") is not None:
            attrs["is_overridden"] = True
        return attrs


class AnalysisSerializer(serializers.Serializer):
    """Full analysis payload — all results for a single call."""
    transcript = TranscriptSerializer(read_only=True)
    sentiment  = SentimentSerializer(read_only=True)
    topic      = TopicSerializer(read_only=True)
    score      = ScoreSerializer(read_only=True)
    summary    = SummarySerializer(read_only=True)
    qa_review  = QAReviewSerializer(read_only=True)