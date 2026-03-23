from django.urls import path
from .views import (
    KPISummaryView,
    CallVolumeView,
    CallBreakdownView,
    CallDurationView,
    SentimentStatsView,
    ScoreStatsView,
    AgentLeaderboardView,
    AgentPerformanceView,
    TopicsView,
    QAStatsView,
    PipelineStatsView,
)

urlpatterns = [
    path("dashboard/kpi/",                        KPISummaryView.as_view(),       name="dashboard-kpi"),
    path("dashboard/calls/volume/",               CallVolumeView.as_view(),        name="dashboard-call-volume"),
    path("dashboard/calls/breakdown/",            CallBreakdownView.as_view(),     name="dashboard-call-breakdown"),
    path("dashboard/calls/duration/",             CallDurationView.as_view(),      name="dashboard-call-duration"),
    path("dashboard/sentiment/",                  SentimentStatsView.as_view(),    name="dashboard-sentiment"),
    path("dashboard/scores/",                     ScoreStatsView.as_view(),        name="dashboard-scores"),
    path("dashboard/agents/leaderboard/",         AgentLeaderboardView.as_view(),  name="dashboard-agent-leaderboard"),
    path("dashboard/agents/<uuid:agent_id>/",     AgentPerformanceView.as_view(),  name="dashboard-agent-performance"),
    path("dashboard/topics/",                     TopicsView.as_view(),            name="dashboard-topics"),
    path("dashboard/qa/",                         QAStatsView.as_view(),           name="dashboard-qa"),
    path("dashboard/pipeline/",                   PipelineStatsView.as_view(),     name="dashboard-pipeline"),
]

