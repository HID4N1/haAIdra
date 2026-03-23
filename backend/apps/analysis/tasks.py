import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def trigger_analysis(self, call_id: str):
    """
    Main pipeline task — orchestrates all 5 steps.
    Called after a call is uploaded or manually re-triggered.
    """
    from apps.calls.models import Call, PipelineJob
    from apps.analysis.models import Transcript, Sentiment, Topic, Score, Summary

    try:
        call = Call.objects.select_related("audio_file", "company").get(id=call_id)
    except Call.DoesNotExist:
        logger.error("Call %s not found", call_id)
        return

    # Get or create pipeline job
    job, _ = PipelineJob.objects.get_or_create(call=call)

    def update_step(step, job_status=PipelineJob.Status.RUNNING):
        job.status       = job_status
        job.current_step = step
        job.started_at   = job.started_at or timezone.now()
        job.save(update_fields=["status", "current_step", "started_at", "updated_at"])
        call.status = Call.Status.PROCESSING
        call.save(update_fields=["status", "updated_at"])

    def mark_done():
        job.status      = PipelineJob.Status.DONE
        job.finished_at = timezone.now()
        job.save(update_fields=["status", "finished_at", "updated_at"])
        call.status = Call.Status.ANALYZED
        call.save(update_fields=["status", "updated_at"])

    def mark_failed(error):
        job.status        = PipelineJob.Status.FAILED
        job.error_message = str(error)
        job.retry_count  += 1
        job.save(update_fields=["status", "error_message", "retry_count", "updated_at"])
        call.status = Call.Status.FAILED
        call.save(update_fields=["status", "updated_at"])

    try:
        # Step 1: Transcription 
        update_step(PipelineJob.Step.TRANSCRIPTION)
        transcript_data = _transcribe(call)
        Transcript.objects.update_or_create(
            call=call,
            defaults={
                "language_detected": transcript_data["language"],
                "word_error_rate":   transcript_data["wer"],
                "duration":          transcript_data["duration"],
                "segments":          transcript_data["segments"],
            }
        )

        # Step 2: Sentiment 
        update_step(PipelineJob.Step.SENTIMENT)
        sentiment_data = _analyse_sentiment(transcript_data["segments"])
        Sentiment.objects.update_or_create(
            call=call,
            defaults={
                "overall_label": sentiment_data["label"],
                "overall_score": sentiment_data["score"],
                "segments":      sentiment_data["segments"],
            }
        )

        # Step 3: Topic detectio
        update_step(PipelineJob.Step.TOPICS)
        topics_data = _detect_topics(transcript_data["segments"])
        from apps.analysis.models import Topic
        Topic.objects.update_or_create(
            call=call,
            defaults={"topics": topics_data}
        )

        # Step 4: Quality scorin
        update_step(PipelineJob.Step.SCORING)
        score_data = _score_call(call, transcript_data, sentiment_data)
        Score.objects.update_or_create(
            call=call,
            defaults={
                "config":        score_data["config"],
                "accueil":       score_data["accueil"],
                "empathie":      score_data["empathie"],
                "resolution":    score_data["resolution"],
                "langage":       score_data["langage"],
                "conformite":    score_data["conformite"],
                "cloture":       score_data["cloture"],
                "total":         score_data["total"],
                "ai_total":      score_data["total"],
                "scored_by":     "ai",
            }
        )

        # Step 5: Summarization 
        update_step(PipelineJob.Step.SUMMARY)
        summary_data = _summarise(call, transcript_data, score_data)
        Summary.objects.update_or_create(
            call=call,
            defaults={
                "motif":           summary_data["motif"],
                "actions":         summary_data["actions"],
                "outcome":         summary_data["outcome"],
                "recommendations": summary_data["recommendations"],
            }
        )

        # Done 
        mark_done()
        logger.info("Pipeline completed for call %s", call_id)

    except Exception as exc:
        mark_failed(exc)
        logger.error("Pipeline failed for call %s: %s", call_id, exc)
        raise self.retry(exc=exc)


# Step implementations (stubs — replace with real ML logic)

def _transcribe(call):
    """
    Stub — replace with Whisper ASR + pyannote diarization.
    Returns: { language, wer, duration, segments }
    """
    return {
        "language": call.language,
        "wer":      0.0,
        "duration": 0.0,
        "segments": [],
    }


def _analyse_sentiment(segments):
    """
    Stub — replace with HF Transformers per-segment sentiment.
    Returns: { label, score, segments }
    """
    return {
        "label":    "neutral",
        "score":    0.5,
        "segments": [],
    }


def _detect_topics(segments):
    """
    Stub — replace with zero-shot BART-MNLI classification.
    Returns: list of { label, score }
    """
    return []


def _score_call(call, transcript_data, sentiment_data):
    """
    Stub — replace with weighted criteria scoring engine.
    Returns: dict of criteria scores + total.
    """
    from apps.users.models import ScoringConfig

    config = ScoringConfig.objects.filter(
        company=call.company, is_active=True
    ).first()

    return {
        "config":     config,
        "accueil":    0.0,
        "empathie":   0.0,
        "resolution": 0.0,
        "langage":    0.0,
        "conformite": 0.0,
        "cloture":    0.0,
        "total":      0.0,
    }


def _summarise(call, transcript_data, score_data):
    """
    Stub — replace with LLM summary generation.
    Returns: { motif, actions, outcome, recommendations }
    """
    return {
        "motif":           "",
        "actions":         "",
        "outcome":         "",
        "recommendations": "",
    }