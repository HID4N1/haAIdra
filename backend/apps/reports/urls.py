from django.urls import path
from .views import (
    CompanyReportView,
    AgentReportView,
    CallQualityReportView,
    SentimentReportView,
    QAReviewReportView,
    ScoreReportView,
    FlaggedReportView,
    TopicsReportView,
    ComparativeReportView,
)

urlpatterns = [
    path("reports/company/",              CompanyReportView.as_view(),      name="report-company"),
    path("reports/agent/<uuid:agent_id>/", AgentReportView.as_view(),       name="report-agent"),
    path("reports/call-quality/",         CallQualityReportView.as_view(),  name="report-call-quality"),
    path("reports/sentiment/",            SentimentReportView.as_view(),    name="report-sentiment"),
    path("reports/qa/",                   QAReviewReportView.as_view(),     name="report-qa"),
    path("reports/scores/",               ScoreReportView.as_view(),        name="report-scores"),
    path("reports/flagged/",              FlaggedReportView.as_view(),      name="report-flagged"),
    path("reports/topics/",               TopicsReportView.as_view(),       name="report-topics"),
    path("reports/comparative/",          ComparativeReportView.as_view(),  name="report-comparative"),
]