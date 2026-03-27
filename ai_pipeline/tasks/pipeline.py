# ai_pipeline/tasks/pipeline.py
"""
Pipeline orchestrator — main Celery task.

This is the entry point for the entire AI processing pipeline.
It orchestrates all 5 steps in sequence and handles:
  - Status updates after each step
  - Error handling and retry logic
  - Cleanup of temporary files
  - Final agent stats update

Pipeline steps:
  1. Transcription   — Whisper ASR + pyannote diarization
  2. Sentiment       — HF Transformers per-segment sentiment
  3. Topic detection — Zero-shot BART-MNLI classification
  4. Quality scoring — Weighted criteria scoring engine
  5. Summarization   — LLM summary + recommendations

Called from Django backend via:
  from apps.analysis.tasks import trigger_analysis
  trigger_analysis.delay(call_id)

The task is defined here in the AI pipeline container and
registered with Celery's task registry via autodiscover_tasks.
"""

import os
import logging
from datetime import datetime, timezone
from celery import Celery

# ── Celery app setup ──────────────────────────────────────────────────────────
# The AI pipeline has its own Celery app that shares the same broker
# (Redis) as the Django backend. This allows Django to push tasks
# that are consumed by the AI pipeline container.

app = Celery("callsight_ai")
app.config_from_object({
    "broker_url":          os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    "result_backend":      os.environ.get("REDIS_URL", "redis://localhost:6379/0"),
    "task_serializer":     "json",
    "result_serializer":   "json",
    "accept_content":      ["json"],
    "timezone":            "UTC",
    "task_track_started":  True,
    "task_acks_late":      True,
    "worker_prefetch_multiplier": 1,  # One task at a time (ML tasks are heavy)
})

logger = logging.getLogger(__name__)


@app.task(
    bind=True,
    name="apps.analysis.tasks.trigger_analysis",  # Must match Django's task name
    max_retries=3,
    default_retry_delay=60,  # Wait 60s before retry
    soft_time_limit=3600,    # 1 hour soft limit
    time_limit=3900,         # 1h 5min hard limit
)
def trigger_analysis(self, call_id: str):
    """
    Main pipeline task — processes a single call through all 5 AI steps.

    Args:
        call_id: UUID string of the call to process.

    The task name must match what Django calls:
        trigger_analysis.delay(call_id)
    """
    from utils.db import (
        get_call, update_pipeline_job, update_call_status,
        update_agent_stats,
    )
    from tasks.transcription import run_transcription
    from tasks.sentiment     import run_sentiment
    from tasks.topics        import run_topics
    from tasks.scoring       import run_scoring
    from tasks.summarization import run_summarization

    logger.info("=" * 60)
    logger.info("Pipeline started: call=%s", call_id)
    logger.info("=" * 60)

    started_at = datetime.now(timezone.utc)

    # ── Fetch call from DB ────────────────────────────────────────────────────
    call = get_call(call_id)
    if not call:
        logger.error("Call not found: %s", call_id)
        return

    if not call.get("s3_key"):
        logger.error("No audio file for call: %s", call_id)
        _mark_failed(call_id, "No audio file found")
        return

    # ── Helper functions ──────────────────────────────────────────────────────

    def update_step(step: str):
        """Updates pipeline job status to running + current step."""
        update_pipeline_job(
            call_id=call_id,
            status="running",
            current_step=step,
            started_at=started_at,
        )
        update_call_status(call_id, "processing")
        logger.info("Step: %s", step)

    def mark_done():
        """Marks the pipeline as complete."""
        finished_at = datetime.now(timezone.utc)
        update_pipeline_job(
            call_id=call_id,
            status="done",
            finished_at=finished_at,
        )
        update_call_status(call_id, "analyzed")

        elapsed = (finished_at - started_at).total_seconds()
        logger.info("Pipeline complete: call=%s in %.1fs", call_id, elapsed)

    try:
        # ── Step 1: Transcription ─────────────────────────────────────────────
        update_step("transcription")
        transcript_data = run_transcription(call)
        logger.info(
            "Step 1 done: %d segments, lang=%s",
            len(transcript_data.get("segments", [])),
            transcript_data.get("language"),
        )

        # ── Step 2: Sentiment analysis ────────────────────────────────────────
        update_step("sentiment")
        sentiment_data = run_sentiment(call, transcript_data)
        logger.info(
            "Step 2 done: overall=%s (%.2f)",
            sentiment_data.get("label"),
            sentiment_data.get("score", 0),
        )

        # ── Step 3: Topic detection ───────────────────────────────────────────
        update_step("topics")
        topics = run_topics(call, transcript_data)
        logger.info(
            "Step 3 done: %d topics detected",
            len(topics),
        )

        # ── Step 4: Quality scoring ───────────────────────────────────────────
        update_step("scoring")
        score_data = run_scoring(call, transcript_data, sentiment_data)
        logger.info(
            "Step 4 done: total=%.2f",
            score_data.get("total", 0),
        )

        # ── Step 5: Summarization ─────────────────────────────────────────────
        update_step("summary")
        summary_data = run_summarization(call, transcript_data, score_data, topics)
        logger.info("Step 5 done: summary generated")

        # ── Pipeline complete ─────────────────────────────────────────────────
        mark_done()

        # Update agent's aggregate stats (total_calls, avg_score)
        if call.get("agent_id"):
            update_agent_stats(call["agent_id"])
            logger.info("Agent stats updated: %s", call["agent_id"])

        return {
            "call_id":    call_id,
            "status":     "done",
            "transcript": len(transcript_data.get("segments", [])),
            "sentiment":  sentiment_data.get("label"),
            "topics":     len(topics),
            "score":      score_data.get("total"),
        }

    except Exception as exc:
        logger.error(
            "Pipeline failed at step for call %s: %s",
            call_id, exc, exc_info=True
        )
        _mark_failed(call_id, str(exc))

        # Retry if under max retries
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(
                "Max retries exceeded for call %s — giving up", call_id
            )
            return {"call_id": call_id, "status": "failed", "error": str(exc)}


def _mark_failed(call_id: str, error_message: str):
    """Marks both the pipeline_job and call as failed."""
    from utils.db import update_pipeline_job, update_call_status
    try:
        update_pipeline_job(
            call_id=call_id,
            status="failed",
            error_message=error_message[:500],  # Truncate long errors
            finished_at=datetime.now(timezone.utc),
        )
        update_call_status(call_id, "failed")
    except Exception as e:
        logger.error("Failed to mark call as failed: %s", e)
