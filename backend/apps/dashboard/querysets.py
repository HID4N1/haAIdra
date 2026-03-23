"""
apps/dashboard/querysets.py

Heavy ORM aggregations for dashboard KPIs.
All queries are tenant-scoped by company_id.
"""

from django.db.models import (
    Avg, Count, Sum, Min, Max, F, Q,
    FloatField, IntegerField, ExpressionWrapper,
)
from django.db.models.functions import (
    TruncDate, TruncWeek, TruncMonth, Coalesce
)
from django.utils import timezone
from datetime import timedelta
from collections import Counter

from apps.calls.models import Call, PipelineJob
from apps.users.models import Agent
from apps.analysis.models import Sentiment, Score, Topic, Transcript, QAReview


# ── Call Volume ───────────────────────────────────────────────────────────────

def get_call_volume_daily(company_id, days=30):
    """Call count grouped by day."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .annotate(date=TruncDate("uploaded_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )


def get_call_volume_weekly(company_id, weeks=12):
    """Call count grouped by week."""
    since = timezone.now() - timedelta(weeks=weeks)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .annotate(week=TruncWeek("uploaded_at"))
        .values("week")
        .annotate(count=Count("id"))
        .order_by("week")
    )


def get_call_volume_monthly(company_id, months=12):
    """Call count grouped by month."""
    since = timezone.now() - timedelta(days=months * 30)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .annotate(month=TruncMonth("uploaded_at"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
    )


def get_call_status_breakdown(company_id, days=30):
    """Call counts by status."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )


def get_call_channel_breakdown(company_id, days=30):
    """Call counts by channel (inbound/outbound)."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .values("channel")
        .annotate(count=Count("id"))
        .order_by("channel")
    )


def get_call_language_breakdown(company_id, days=30):
    """Call counts by language."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .values("language")
        .annotate(count=Count("id"))
        .order_by("language")
    )


def get_call_resolution_breakdown(company_id, days=30):
    """Call counts by resolution status."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .values("resolution_status")
        .annotate(count=Count("id"))
        .order_by("resolution_status")
    )


def get_avg_call_duration(company_id, days=30):
    """Average call duration in seconds."""
    since = timezone.now() - timedelta(days=days)
    return (
        Call.objects
        .filter(company_id=company_id, uploaded_at__gte=since)
        .aggregate(
            avg_duration=Avg("duration"),
            min_duration=Min("duration"),
            max_duration=Max("duration"),
            total_duration=Sum("duration"),
        )
    )


# ── Sentiment ─────────────────────────────────────────────────────────────────

def get_sentiment_breakdown(company_id, days=30):
    """Sentiment label counts."""
    since = timezone.now() - timedelta(days=days)
    qs = Sentiment.objects.filter(
        call__company_id=company_id,
        call__uploaded_at__gte=since,
    )
    breakdown = qs.values("overall_label").annotate(count=Count("id"))
    counts = {item["overall_label"]: item["count"] for item in breakdown}
    total  = sum(counts.values())
    return {
        "positive": counts.get("positive", 0),
        "neutral":  counts.get("neutral",  0),
        "negative": counts.get("negative", 0),
        "total":    total,
        "positive_pct": round(counts.get("positive", 0) / total * 100, 1) if total else 0,
        "neutral_pct":  round(counts.get("neutral",  0) / total * 100, 1) if total else 0,
        "negative_pct": round(counts.get("negative", 0) / total * 100, 1) if total else 0,
    }


def get_sentiment_trend(company_id, days=30):
    """Sentiment evolution over time — grouped by day."""
    since = timezone.now() - timedelta(days=days)
    return (
        Sentiment.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date", "overall_label")
        .annotate(count=Count("id"))
        .order_by("date", "overall_label")
    )


def get_avg_sentiment_score(company_id, days=30):
    """Average sentiment score over time."""
    since = timezone.now() - timedelta(days=days)
    return (
        Sentiment.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(avg_score=Avg("overall_score"))
        .order_by("date")
    )


# ── Scores ────────────────────────────────────────────────────────────────────

def get_score_summary(company_id, days=30):
    """Average scores per criteria across all analyzed calls."""
    since = timezone.now() - timedelta(days=days)
    return (
        Score.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .aggregate(
            avg_total=Avg("total"),
            avg_accueil=Avg("accueil"),
            avg_empathie=Avg("empathie"),
            avg_resolution=Avg("resolution"),
            avg_langage=Avg("langage"),
            avg_conformite=Avg("conformite"),
            avg_cloture=Avg("cloture"),
            min_total=Min("total"),
            max_total=Max("total"),
        )
    )


def get_score_trend(company_id, days=30):
    """Average total score over time — grouped by day."""
    since = timezone.now() - timedelta(days=days)
    return (
        Score.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(avg_score=Avg("total"))
        .order_by("date")
    )


def get_score_distribution(company_id, days=30):
    """Score distribution in buckets: 0-20, 20-40, 40-60, 60-80, 80-100."""
    since = timezone.now() - timedelta(days=days)
    qs = (
        Score.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .values_list("total", flat=True)
    )
    buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
    for score in qs:
        if score < 20:      buckets["0-20"]   += 1
        elif score < 40:    buckets["20-40"]  += 1
        elif score < 60:    buckets["40-60"]  += 1
        elif score < 80:    buckets["60-80"]  += 1
        else:               buckets["80-100"] += 1
    return buckets


# ── Agent Leaderboard ─────────────────────────────────────────────────────────

def get_agent_leaderboard(company_id, days=30, limit=10):
    """Agent leaderboard ranked by avg score."""
    since = timezone.now() - timedelta(days=days)
    return (
        Agent.objects
        .filter(company_id=company_id, status="active")
        .select_related("user")
        .annotate(
            calls_in_period=Count(
                "calls",
                filter=Q(calls__uploaded_at__gte=since)
            ),
            analyzed_calls=Count(
                "calls",
                filter=Q(
                    calls__uploaded_at__gte=since,
                    calls__status="analyzed"
                )
            ),
            period_avg_score=Avg(
                "calls__score__total",
                filter=Q(calls__uploaded_at__gte=since)
            ),
            period_avg_sentiment=Avg(
                "calls__sentiment__overall_score",
                filter=Q(calls__uploaded_at__gte=since)
            ),
        )
        .order_by(F("period_avg_score").desc(nulls_last=True))[:limit]
    )


def get_agent_performance(company_id, agent_id, days=30):
    """Detailed performance stats for a single agent."""
    since = timezone.now() - timedelta(days=days)
    score_data = (
        Score.objects
        .filter(
            call__company_id=company_id,
            call__agent_id=agent_id,
            call__uploaded_at__gte=since,
        )
        .aggregate(
            avg_total=Avg("total"),
            avg_accueil=Avg("accueil"),
            avg_empathie=Avg("empathie"),
            avg_resolution=Avg("resolution"),
            avg_langage=Avg("langage"),
            avg_conformite=Avg("conformite"),
            avg_cloture=Avg("cloture"),
        )
    )
    call_data = (
        Call.objects
        .filter(
            company_id=company_id,
            agent_id=agent_id,
            uploaded_at__gte=since,
        )
        .aggregate(
            total_calls=Count("id"),
            analyzed=Count("id", filter=Q(status="analyzed")),
            flagged=Count("id", filter=Q(is_flagged=True)),
            resolved=Count("id", filter=Q(resolution_status="resolved")),
        )
    )
    return {**score_data, **call_data}


def get_agent_score_trend(company_id, agent_id, days=30):
    """Score trend over time for a single agent."""
    since = timezone.now() - timedelta(days=days)
    return (
        Score.objects
        .filter(
            call__company_id=company_id,
            call__agent_id=agent_id,
            call__uploaded_at__gte=since,
        )
        .annotate(date=TruncDate("call__uploaded_at"))
        .values("date")
        .annotate(avg_score=Avg("total"))
        .order_by("date")
    )


# ── Topics ────────────────────────────────────────────────────────────────────

def get_topic_frequency(company_id, days=30, limit=20):
    """Most frequent topics across all analyzed calls."""
    since = timezone.now() - timedelta(days=days)
    topics = (
        Topic.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .values_list("topics", flat=True)
    )
    counter = Counter()
    for topic_list in topics:
        for item in (topic_list or []):
            label = item.get("label")
            if label:
                counter[label] += 1
    return [{"label": l, "count": c} for l, c in counter.most_common(limit)]


# ── QA Reviews ────────────────────────────────────────────────────────────────

def get_qa_stats(company_id, days=30):
    """QA review statistics."""
    since = timezone.now() - timedelta(days=days)
    qs = QAReview.objects.filter(
        call__company_id=company_id,
        call__uploaded_at__gte=since,
    )
    return qs.aggregate(
        total=Count("id"),
        approved=Count("id", filter=Q(status="approved")),
        rejected=Count("id", filter=Q(status="rejected")),
        pending=Count("id", filter=Q(status="pending")),
        overridden=Count("id", filter=Q(is_overridden=True)),
        avg_override_score=Avg("score_override", filter=Q(is_overridden=True)),
    )


# ── Pipeline ──────────────────────────────────────────────────────────────────

def get_pipeline_stats(company_id, days=30):
    """Pipeline job health statistics."""
    since = timezone.now() - timedelta(days=days)
    return (
        PipelineJob.objects
        .filter(call__company_id=company_id, created_at__gte=since)
        .aggregate(
            total=Count("id"),
            queued=Count("id", filter=Q(status="queued")),
            running=Count("id", filter=Q(status="running")),
            done=Count("id", filter=Q(status="done")),
            failed=Count("id", filter=Q(status="failed")),
            avg_retries=Avg("retry_count"),
        )
    )


# ── KPI Summary ───────────────────────────────────────────────────────────────

def get_kpi_summary(company_id, days=30):
    """Top-level KPI summary for the dashboard header."""
    since  = timezone.now() - timedelta(days=days)
    calls  = Call.objects.filter(company_id=company_id, uploaded_at__gte=since)
    total  = calls.count()

    analyzed  = calls.filter(status="analyzed").count()
    flagged   = calls.filter(is_flagged=True).count()
    resolved  = calls.filter(resolution_status="resolved").count()
    failed    = calls.filter(status="failed").count()

    avg_score = (
        Score.objects
        .filter(call__company_id=company_id, call__uploaded_at__gte=since)
        .aggregate(avg=Avg("total"))["avg"] or 0.0
    )

    avg_duration = (
        calls.aggregate(avg=Avg("duration"))["avg"] or 0.0
    )

    return {
        "period_days":      days,
        "total_calls":      total,
        "analyzed_calls":   analyzed,
        "failed_calls":     failed,
        "pending_calls":    total - analyzed - failed,
        "flagged_calls":    flagged,
        "avg_score":        round(avg_score, 2),
        "avg_duration":     round(avg_duration, 1),
        "resolution_rate":  round(resolved / total * 100, 1) if total else 0.0,
        "analysis_rate":    round(analyzed / total * 100, 1) if total else 0.0,
    }