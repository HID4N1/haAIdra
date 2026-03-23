from rest_framework import serializers


class KPISummarySerializer(serializers.Serializer):
    period_days     = serializers.IntegerField()
    total_calls     = serializers.IntegerField()
    analyzed_calls  = serializers.IntegerField()
    failed_calls    = serializers.IntegerField()
    pending_calls   = serializers.IntegerField()
    flagged_calls   = serializers.IntegerField()
    avg_score       = serializers.FloatField()
    avg_duration    = serializers.FloatField()
    resolution_rate = serializers.FloatField()
    analysis_rate   = serializers.FloatField()


class CallVolumeSerializer(serializers.Serializer):
    date  = serializers.DateField()
    count = serializers.IntegerField()


class CallVolumeWeeklySerializer(serializers.Serializer):
    week  = serializers.DateTimeField()
    count = serializers.IntegerField()


class CallVolumeMonthlySerializer(serializers.Serializer):
    month = serializers.DateTimeField()
    count = serializers.IntegerField()


class CallStatusBreakdownSerializer(serializers.Serializer):
    status = serializers.CharField()
    count  = serializers.IntegerField()


class CallChannelBreakdownSerializer(serializers.Serializer):
    channel = serializers.CharField()
    count   = serializers.IntegerField()


class CallLanguageBreakdownSerializer(serializers.Serializer):
    language = serializers.CharField()
    count    = serializers.IntegerField()


class CallResolutionBreakdownSerializer(serializers.Serializer):
    resolution_status = serializers.CharField()
    count             = serializers.IntegerField()


class CallDurationSerializer(serializers.Serializer):
    avg_duration   = serializers.FloatField()
    min_duration   = serializers.FloatField()
    max_duration   = serializers.FloatField()
    total_duration = serializers.FloatField()


class SentimentBreakdownSerializer(serializers.Serializer):
    positive     = serializers.IntegerField()
    neutral      = serializers.IntegerField()
    negative     = serializers.IntegerField()
    total        = serializers.IntegerField()
    positive_pct = serializers.FloatField()
    neutral_pct  = serializers.FloatField()
    negative_pct = serializers.FloatField()


class SentimentTrendSerializer(serializers.Serializer):
    date          = serializers.DateField()
    overall_label = serializers.CharField()
    count         = serializers.IntegerField()


class SentimentScoreSerializer(serializers.Serializer):
    date      = serializers.DateField()
    avg_score = serializers.FloatField()


class ScoreSummarySerializer(serializers.Serializer):
    avg_total      = serializers.FloatField()
    avg_accueil    = serializers.FloatField()
    avg_empathie   = serializers.FloatField()
    avg_resolution = serializers.FloatField()
    avg_langage    = serializers.FloatField()
    avg_conformite = serializers.FloatField()
    avg_cloture    = serializers.FloatField()
    min_total      = serializers.FloatField()
    max_total      = serializers.FloatField()


class ScoreTrendSerializer(serializers.Serializer):
    date      = serializers.DateField()
    avg_score = serializers.FloatField()


class ScoreDistributionSerializer(serializers.Serializer):
    bucket = serializers.CharField()
    count  = serializers.IntegerField()


class AgentLeaderboardSerializer(serializers.Serializer):
    id                  = serializers.UUIDField()
    email               = serializers.CharField()
    department          = serializers.CharField()
    total_calls         = serializers.IntegerField()
    calls_in_period     = serializers.IntegerField()
    analyzed_calls      = serializers.IntegerField()
    avg_score           = serializers.FloatField()
    period_avg_score    = serializers.FloatField(allow_null=True)
    period_avg_sentiment = serializers.FloatField(allow_null=True)


class AgentPerformanceSerializer(serializers.Serializer):
    total_calls    = serializers.IntegerField()
    analyzed       = serializers.IntegerField()
    flagged        = serializers.IntegerField()
    resolved       = serializers.IntegerField()
    avg_total      = serializers.FloatField(allow_null=True)
    avg_accueil    = serializers.FloatField(allow_null=True)
    avg_empathie   = serializers.FloatField(allow_null=True)
    avg_resolution = serializers.FloatField(allow_null=True)
    avg_langage    = serializers.FloatField(allow_null=True)
    avg_conformite = serializers.FloatField(allow_null=True)
    avg_cloture    = serializers.FloatField(allow_null=True)


class AgentScoreTrendSerializer(serializers.Serializer):
    date      = serializers.DateField()
    avg_score = serializers.FloatField()


class TopicFrequencySerializer(serializers.Serializer):
    label = serializers.CharField()
    count = serializers.IntegerField()


class QAStatsSerializer(serializers.Serializer):
    total             = serializers.IntegerField()
    approved          = serializers.IntegerField()
    rejected          = serializers.IntegerField()
    pending           = serializers.IntegerField()
    overridden        = serializers.IntegerField()
    avg_override_score = serializers.FloatField(allow_null=True)


class PipelineStatsSerializer(serializers.Serializer):
    total       = serializers.IntegerField()
    queued      = serializers.IntegerField()
    running     = serializers.IntegerField()
    done        = serializers.IntegerField()
    failed      = serializers.IntegerField()
    avg_retries = serializers.FloatField(allow_null=True)