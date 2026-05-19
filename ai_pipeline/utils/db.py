# ai_pipeline/utils/db.py
"""
Database utility — writes AI pipeline results back to PostgreSQL.

The AI pipeline container does NOT use Django ORM .
Instead it uses raw psycopg2 to write results directly to the database.

This keeps the AI container lightweight — only ML dependencies,
no Django, no DRF, no migrations.

Tables written to:
  - transcript      — Whisper ASR output
  - sentiment       — HF Transformers sentiment
  - topic           — BART-MNLI topic classification
  - score           — weighted criteria scoring
  - summary         — LLM-generated summary
  - pipeline_job    — status updates throughout the pipeline
  - call            — final status update (analyzed/failed)
"""

import os
import json
import uuid
import logging
import psycopg2
import psycopg2.extras
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)


# ── Connection ────────────────────────────────────────────────────────────────

def get_connection():
    """
    Returns a psycopg2 connection using environment variables.

    Uses a fresh connection per call — the pipeline tasks are
    long-running and connection pooling adds complexity without
    significant benefit in this context.
    """
    return psycopg2.connect(
        dbname=os.environ.get("DB_NAME",     "callsight"),
        user=os.environ.get("DB_USER",       "callsight"),
        password=os.environ.get("DB_PASSWORD", "callsight"),
        host=os.environ.get("DB_HOST",       "localhost"),
        port=os.environ.get("DB_PORT",       "5432"),
    )


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Pipeline job updates ──────────────────────────────────────────────────────

def update_pipeline_job(
    call_id: str,
    status: str,
    current_step: Optional[str] = None,
    error_message: Optional[str] = None,
    started_at: Optional[datetime] = None,
    finished_at: Optional[datetime] = None,
    retry_count: Optional[int] = None,
):
    """
    Updates the pipeline_job record for a call.

    Called at the start of each pipeline step to update status and
    current_step so the frontend can poll for progress.

    Args:
        call_id:       UUID of the call being processed.
        status:        queued | running | done | failed
        current_step:  transcription | sentiment | topics | scoring | summary
        error_message: Error details if status=failed
        started_at:    When the pipeline started (set on first update)
        finished_at:   When the pipeline completed (set on done/failed)
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE pipeline_job
                SET
                    status        = %s,
                    current_step  = COALESCE(%s, current_step),
                    error_message = COALESCE(%s, error_message),
                    started_at    = COALESCE(started_at, %s),
                    finished_at   = COALESCE(%s, finished_at),
                    retry_count   = COALESCE(%s, retry_count),
                    updated_at    = %s
                WHERE call_id = %s
            """, (
                status,
                current_step,
                error_message,
                started_at or _now(),
                finished_at,
                retry_count,
                _now(),
                call_id,
            ))
            conn.commit()
            logger.debug("pipeline_job updated: call=%s status=%s step=%s",
                         call_id, status, current_step)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to update pipeline_job for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


def update_call_status(call_id: str, status: str):
    """
    Updates the status field on the call record.

    Called at the start (status=processing) and end (status=analyzed|failed)
    of the pipeline so the frontend knows the call is being processed.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE call
                SET status = %s, updated_at = %s
                WHERE id = %s
            """, (status, _now(), call_id))
            conn.commit()
            logger.debug("call status updated: %s → %s", call_id, status)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to update call status for %s: %s", call_id, e)
        raise
    finally:
        conn.close()


def update_call_duration(call_id: str, duration: float):
    """Stores transcript/audio duration on the call for dashboard tables."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE call
                SET duration = %s, updated_at = %s
                WHERE id = %s
            """, (int(round(duration or 0)), _now(), call_id))
            conn.commit()
            logger.debug("call duration updated: %s -> %.1fs", call_id, duration or 0)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to update call duration for %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Transcript ────────────────────────────────────────────────────────────────

def save_transcript(
    call_id: str,
    language_detected: str,
    word_error_rate: float,
    duration: float,
    segments: List[Dict],
):
    """
    Inserts or updates the transcript record for a call.

    segments is a list of dicts:
    [{ "start": 0.0, "end": 2.5, "speaker": "SPEAKER_00", "text": "..." }, ...]
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO transcript
                    (id, call_id, language_detected, word_error_rate,
                     duration, segments, created_at, updated_at,
                     is_deleted)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, false)
                ON CONFLICT (call_id) DO UPDATE SET
                    language_detected = EXCLUDED.language_detected,
                    word_error_rate   = EXCLUDED.word_error_rate,
                    duration          = EXCLUDED.duration,
                    segments          = EXCLUDED.segments,
                    updated_at        = EXCLUDED.updated_at
            """, (
                str(uuid.uuid4()),
                call_id,
                language_detected,
                word_error_rate,
                duration,
                json.dumps(segments),
                _now(), _now(),
            ))
            conn.commit()
            logger.info("Transcript saved for call %s (%d segments)", call_id, len(segments))
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save transcript for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Sentiment ─────────────────────────────────────────────────────────────────

def save_sentiment(
    call_id: str,
    overall_label: str,
    overall_score: float,
    segments: List[Dict],
):
    """
    Inserts or updates the sentiment record for a call.

    segments is a list of dicts:
    [{ "start": 0.0, "end": 2.5, "label": "positive", "score": 0.92 }, ...]
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sentiment
                    (id, call_id, overall_label, overall_score,
                     segments, created_at, updated_at, is_deleted)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, false)
                ON CONFLICT (call_id) DO UPDATE SET
                    overall_label = EXCLUDED.overall_label,
                    overall_score = EXCLUDED.overall_score,
                    segments      = EXCLUDED.segments,
                    updated_at    = EXCLUDED.updated_at
            """, (
                str(uuid.uuid4()),
                call_id,
                overall_label,
                overall_score,
                json.dumps(segments),
                _now(), _now(),
            ))
            conn.commit()
            logger.info("Sentiment saved for call %s: %s (%.2f)",
                        call_id, overall_label, overall_score)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save sentiment for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Topics ────────────────────────────────────────────────────────────────────

def save_topics(call_id: str, topics: List[Dict]):
    """
    Inserts or updates the topic record for a call.

    topics is a list of dicts:
    [{ "label": "billing", "score": 0.87 }, ...]
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO topic
                    (id, call_id, topics, created_at, updated_at, is_deleted)
                VALUES
                    (%s, %s, %s, %s, %s, false)
                ON CONFLICT (call_id) DO UPDATE SET
                    topics     = EXCLUDED.topics,
                    updated_at = EXCLUDED.updated_at
            """, (
                str(uuid.uuid4()),
                call_id,
                json.dumps(topics),
                _now(), _now(),
            ))
            conn.commit()
            logger.info("Topics saved for call %s: %d topics", call_id, len(topics))
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save topics for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Score ─────────────────────────────────────────────────────────────────────

def save_score(
    call_id: str,
    config_id: Optional[str],
    accueil: float,     accueil_max: float,
    empathie: float,    empathie_max: float,
    resolution: float,  resolution_max: float,
    langage: float,     langage_max: float,
    conformite: float,  conformite_max: float,
    cloture: float,     cloture_max: float,
    total: float,
    ai_total: float,
    scored_by: str = "ai",
):
    """
    Inserts or updates the score record for a call.
    All criteria scores are floats between 0 and their respective max.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO score (
                    id, call_id, config_id,
                    accueil, accueil_max,
                    empathie, empathie_max,
                    resolution, resolution_max,
                    langage, langage_max,
                    conformite, conformite_max,
                    cloture, cloture_max,
                    total, ai_total, scored_by,
                    created_at, updated_at, is_deleted
                ) VALUES (
                    %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, false
                )
                ON CONFLICT (call_id) DO UPDATE SET
                    accueil       = EXCLUDED.accueil,
                    empathie      = EXCLUDED.empathie,
                    resolution    = EXCLUDED.resolution,
                    langage       = EXCLUDED.langage,
                    conformite    = EXCLUDED.conformite,
                    cloture       = EXCLUDED.cloture,
                    total         = EXCLUDED.total,
                    ai_total      = EXCLUDED.ai_total,
                    scored_by     = EXCLUDED.scored_by,
                    updated_at    = EXCLUDED.updated_at
            """, (
                str(uuid.uuid4()), call_id, config_id,
                accueil, accueil_max,
                empathie, empathie_max,
                resolution, resolution_max,
                langage, langage_max,
                conformite, conformite_max,
                cloture, cloture_max,
                total, ai_total, scored_by,
                _now(), _now(),
            ))
            conn.commit()
            logger.info("Score saved for call %s: total=%.2f", call_id, total)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save score for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Summary ───────────────────────────────────────────────────────────────────

def save_summary(
    call_id: str,
    motif: str,
    actions: str,
    outcome: str,
    recommendations: str,
):
    """
    Inserts or updates the summary record for a call.
    All fields are plain text generated by the LLM.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO summary
                    (id, call_id, motif, actions, outcome,
                     recommendations, created_at, updated_at, is_deleted)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, false)
                ON CONFLICT (call_id) DO UPDATE SET
                    motif           = EXCLUDED.motif,
                    actions         = EXCLUDED.actions,
                    outcome         = EXCLUDED.outcome,
                    recommendations = EXCLUDED.recommendations,
                    updated_at      = EXCLUDED.updated_at
            """, (
                str(uuid.uuid4()),
                call_id,
                motif, actions, outcome, recommendations,
                _now(), _now(),
            ))
            conn.commit()
            logger.info("Summary saved for call %s", call_id)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to save summary for call %s: %s", call_id, e)
        raise
    finally:
        conn.close()


# ── Fetch helpers (used by pipeline tasks) ────────────────────────────────────

def get_call(call_id: str) -> Optional[Dict]:
    """
    Fetches call metadata needed by the pipeline.
    Returns dict with: id, company_id, agent_id, language, s3_key
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    c.id, c.company_id, c.agent_id, c.language,
                    c.status, c.duration,
                    af.s3_key,
                    co.tenant_id
                FROM call c
                LEFT JOIN audio_file af ON af.call_id = c.id
                LEFT JOIN company    co ON co.id = c.company_id
                WHERE c.id = %s AND c.is_deleted = false
            """, (call_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def get_scoring_config(company_id: str) -> Optional[Dict]:
    """
    Fetches the active scoring config for a company.
    Returns dict with all weight fields.
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT *
                FROM scoring_config
                WHERE company_id = %s
                  AND is_active = true
                  AND is_deleted = false
                LIMIT 1
            """, (company_id,))
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        conn.close()


def update_agent_stats(agent_id: str):
    """
    Recalculates and updates total_calls and avg_score on the agent record.
    Called after a call is scored to keep agent stats fresh.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE agent
                SET
                    total_calls = (
                        SELECT COUNT(*)
                        FROM call
                        WHERE agent_id = %s
                          AND status = 'analyzed'
                          AND is_deleted = false
                    ),
                    avg_score = (
                        SELECT COALESCE(AVG(s.total), 0)
                        FROM score s
                        JOIN call c ON c.id = s.call_id
                        WHERE c.agent_id = %s
                          AND c.is_deleted = false
                          AND s.is_deleted = false
                    ),
                    updated_at = %s
                WHERE id = %s
            """, (agent_id, agent_id, _now(), agent_id))
            conn.commit()
            logger.info("Agent stats updated: %s", agent_id)
    except Exception as e:
        conn.rollback()
        logger.error("Failed to update agent stats for %s: %s", agent_id, e)
    finally:
        conn.close()
