import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.permissions import IsManager, IsQASupervisor, IsAgent
from .querysets import (
    get_kpi_summary,
    get_call_volume_daily, get_call_volume_weekly, get_call_volume_monthly,
    get_call_status_breakdown, get_call_channel_breakdown,
    get_call_language_breakdown, get_call_resolution_breakdown,
    get_avg_call_duration,
    get_sentiment_breakdown, get_sentiment_trend, get_avg_sentiment_score,
    get_score_summary, get_score_trend, get_score_distribution,
    get_agent_leaderboard, get_agent_performance, get_agent_score_trend,
    get_topic_frequency,
    get_qa_stats,
    get_pipeline_stats,
)
from .serializers import (
    KPISummarySerializer,
    CallVolumeSerializer, CallVolumeWeeklySerializer, CallVolumeMonthlySerializer,
    CallStatusBreakdownSerializer, CallChannelBreakdownSerializer,
    CallLanguageBreakdownSerializer, CallResolutionBreakdownSerializer,
    CallDurationSerializer,
    SentimentBreakdownSerializer, SentimentTrendSerializer, SentimentScoreSerializer,
    ScoreSummarySerializer, ScoreTrendSerializer, ScoreDistributionSerializer,
    AgentLeaderboardSerializer, AgentPerformanceSerializer, AgentScoreTrendSerializer,
    TopicFrequencySerializer,
    QAStatsSerializer,
    PipelineStatsSerializer,
)

logger = logging.getLogger(__name__)


def _days(request, default=30):
    try:
        return int(request.query_params.get("days", default))
    except (ValueError, TypeError):
        return default


class KPISummaryView(APIView):
    """GET /api/v1/dashboard/kpi/"""
    permission_classes = [IsManager]

    def get(self, request):
        data = get_kpi_summary(request.user.company_id, days=_days(request))
        return Response(KPISummarySerializer(data).data)


class CallVolumeView(APIView):
    """GET /api/v1/dashboard/calls/volume/?period=daily|weekly|monthly&days=30"""
    permission_classes = [IsManager]

    def get(self, request):
        period  = request.query_params.get("period", "daily")
        days    = _days(request)
        company = request.user.company_id

        if period == "weekly":
            data       = list(get_call_volume_weekly(company, weeks=days // 7 or 12))
            serializer = CallVolumeWeeklySerializer(data, many=True)
        elif period == "monthly":
            data       = list(get_call_volume_monthly(company, months=days // 30 or 12))
            serializer = CallVolumeMonthlySerializer(data, many=True)
        else:
            data       = list(get_call_volume_daily(company, days=days))
            serializer = CallVolumeSerializer(data, many=True)

        return Response(serializer.data)


class CallBreakdownView(APIView):
    """GET /api/v1/dashboard/calls/breakdown/?by=status|channel|language|resolution"""
    permission_classes = [IsManager]

    def get(self, request):
        by      = request.query_params.get("by", "status")
        days    = _days(request)
        company = request.user.company_id

        if by == "channel":
            data = list(get_call_channel_breakdown(company, days))
            serializer = CallChannelBreakdownSerializer(data, many=True)
        elif by == "language":
            data = list(get_call_language_breakdown(company, days))
            serializer = CallLanguageBreakdownSerializer(data, many=True)
        elif by == "resolution":
            data = list(get_call_resolution_breakdown(company, days))
            serializer = CallResolutionBreakdownSerializer(data, many=True)
        else:
            data = list(get_call_status_breakdown(company, days))
            serializer = CallStatusBreakdownSerializer(data, many=True)

        return Response(serializer.data)


class CallDurationView(APIView):
    """GET /api/v1/dashboard/calls/duration/"""
    permission_classes = [IsManager]

    def get(self, request):
        data = get_avg_call_duration(request.user.company_id, days=_days(request))
        return Response(CallDurationSerializer(data).data)


class SentimentStatsView(APIView):
    """GET /api/v1/dashboard/sentiment/"""
    permission_classes = [IsManager]

    def get(self, request):
        company = request.user.company_id
        days    = _days(request)
        return Response({
            "breakdown": SentimentBreakdownSerializer(
                get_sentiment_breakdown(company, days)
            ).data,
            "trend": SentimentTrendSerializer(
                list(get_sentiment_trend(company, days)), many=True
            ).data,
            "score_trend": SentimentScoreSerializer(
                list(get_avg_sentiment_score(company, days)), many=True
            ).data,
        })


class ScoreStatsView(APIView):
    """GET /api/v1/dashboard/scores/"""
    permission_classes = [IsManager]

    def get(self, request):
        company = request.user.company_id
        days    = _days(request)
        dist    = get_score_distribution(company, days)
        return Response({
            "summary": ScoreSummarySerializer(
                get_score_summary(company, days)
            ).data,
            "trend": ScoreTrendSerializer(
                list(get_score_trend(company, days)), many=True
            ).data,
            "distribution": [
                {"bucket": k, "count": v} for k, v in dist.items()
            ],
        })


class AgentLeaderboardView(APIView):
    """GET /api/v1/dashboard/agents/leaderboard/"""
    permission_classes = [IsManager]

    def get(self, request):
        company = request.user.company_id
        days    = _days(request)
        limit   = int(request.query_params.get("limit", 10))
        agents  = get_agent_leaderboard(company, days=days, limit=limit)

        data = []
        for agent in agents:
            data.append({
                "id":                   agent.id,
                "email":                agent.user.email,
                "department":           agent.department,
                "total_calls":          agent.total_calls,
                "calls_in_period":      agent.calls_in_period,
                "analyzed_calls":       agent.analyzed_calls,
                "avg_score":            agent.avg_score,
                "period_avg_score":     agent.period_avg_score,
                "period_avg_sentiment": agent.period_avg_sentiment,
            })

        return Response(AgentLeaderboardSerializer(data, many=True).data)


class AgentPerformanceView(APIView):
    """GET /api/v1/dashboard/agents/{agent_id}/"""
    permission_classes = [IsQASupervisor]

    def get(self, request, agent_id):
        company = request.user.company_id
        days    = _days(request)
        perf    = get_agent_performance(company, agent_id, days)
        trend   = list(get_agent_score_trend(company, agent_id, days))
        return Response({
            "performance": AgentPerformanceSerializer(perf).data,
            "score_trend": AgentScoreTrendSerializer(trend, many=True).data,
        })


class TopicsView(APIView):
    """GET /api/v1/dashboard/topics/"""
    permission_classes = [IsManager]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))
        data  = get_topic_frequency(
            request.user.company_id,
            days=_days(request),
            limit=limit,
        )
        return Response(TopicFrequencySerializer(data, many=True).data)


class QAStatsView(APIView):
    """GET /api/v1/dashboard/qa/"""
    permission_classes = [IsQASupervisor]

    def get(self, request):
        data = get_qa_stats(request.user.company_id, days=_days(request))
        return Response(QAStatsSerializer(data).data)


class PipelineStatsView(APIView):
    """GET /api/v1/dashboard/pipeline/"""
    permission_classes = [IsManager]

    def get(self, request):
        data = get_pipeline_stats(request.user.company_id, days=_days(request))
        return Response(PipelineStatsSerializer(data).data)