# apps/analysis/tasks.py

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="apps.analysis.tasks.trigger_analysis",  # Must match pipeline.py
    max_retries=3,
    default_retry_delay=60,
)
def trigger_analysis(self, call_id: str):
    """
    Proxy task — pushes the call_id to the shared Celery broker.
    The actual processing runs in the ai_pipeline container.
    
    This task exists in Django only so views can call:
        trigger_analysis.delay(call_id)
    
    The ai_pipeline container picks it up via the same Redis broker.
    """
    logger.info("Queued analysis for call: %s", call_id)
