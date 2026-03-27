# ai_pipeline/tasks/topics.py
"""
Topic detection task — Step 3 of the AI pipeline.

Uses zero-shot classification (facebook/bart-large-mnli) to detect
the main topics discussed in a call without needing labeled training data.

Zero-shot classification works by framing topic detection as a natural
language inference problem: "Does this text discuss [topic]?"

Predefined topics (can be extended via TOPIC_LABELS env var):
  - billing / payment
  - technical support
  - complaint
  - cancellation
  - subscription / upgrade
  - delivery / shipping
  - refund
  - account management
  - general inquiry
  - escalation

Pipeline:
  1. Concatenate transcript segments into a single text (or sliding windows)
  2. Run zero-shot classification against all topic labels
  3. Filter topics above confidence threshold
  4. Save to DB

Output shape:
  topics: [
    { "label": "billing", "score": 0.87 },
    { "label": "complaint", "score": 0.72 },
    ...
  ]
"""

import os
import logging
from typing import Dict, List

from utils.db    import save_topics
from models.loaders import get_topic_pipeline

logger = logging.getLogger(__name__)

# Default topic labels — can be overridden per company in the future
DEFAULT_TOPIC_LABELS = [
    "billing and payment",
    "technical support",
    "complaint",
    "cancellation",
    "subscription upgrade",
    "delivery and shipping",
    "refund request",
    "account management",
    "general inquiry",
    "escalation",
    "product information",
    "appointment scheduling",
    "fraud and security",
    "loyalty and rewards",
]

# Minimum confidence score to include a topic in results
DEFAULT_THRESHOLD = 0.3

# Maximum text length to send to the model (BART has a 1024 token limit)
MAX_CHARS = 1500


def run_topics(call: Dict, transcript_data: Dict) -> List[Dict]:
    """
    Main topic detection entry point called by the pipeline orchestrator.

    Args:
        call:            Dict from db.get_call()
        transcript_data: Dict from run_transcription() with segments

    Returns:
        List of topic dicts: [{ "label": str, "score": float }, ...]
        Sorted by score descending.
    """
    call_id  = call["id"]
    segments = transcript_data.get("segments", [])

    logger.info("Starting topic detection for call %s", call_id)

    if not segments:
        logger.warning("No segments for topic detection: call %s", call_id)
        save_topics(call_id, [])
        return []

    # ── Build text for classification ─────────────────────────────────────────
    full_text   = _build_text(segments)
    topic_labels = _get_topic_labels()
    threshold    = float(os.environ.get("TOPIC_THRESHOLD", DEFAULT_THRESHOLD))

    logger.info(
        "Running zero-shot classification: %d chars, %d labels",
        len(full_text), len(topic_labels)
    )

    # ── Run classification ────────────────────────────────────────────────────
    topics = _classify(full_text, topic_labels, threshold)

    # ── Save to DB ────────────────────────────────────────────────────────────
    save_topics(call_id, topics)

    logger.info(
        "Topic detection complete: call=%s, %d topics detected",
        call_id, len(topics)
    )

    return topics


# ── Text preparation ──────────────────────────────────────────────────────────

def _build_text(segments: List[Dict]) -> str:
    """
    Concatenates transcript segments into a single text string
    for topic classification.

    If the text is too long for the model, takes a sliding window
    from the beginning, middle, and end of the call to capture
    the full context without truncation.

    Args:
        segments: List of { start, end, speaker, text } dicts.

    Returns:
        Concatenated text string, max MAX_CHARS characters.
    """
    full_text = " ".join(
        seg.get("text", "").strip()
        for seg in segments
        if seg.get("text", "").strip()
    )

    if len(full_text) <= MAX_CHARS:
        return full_text

    # Text too long — take beginning + middle + end
    third = MAX_CHARS // 3
    beginning = full_text[:third]
    middle    = full_text[len(full_text)//2 - third//2 : len(full_text)//2 + third//2]
    end       = full_text[-third:]

    combined = f"{beginning} ... {middle} ... {end}"
    logger.debug("Text truncated: %d → %d chars", len(full_text), len(combined))
    return combined


def _get_topic_labels() -> List[str]:
    """
    Returns topic labels, allowing override via TOPIC_LABELS env var.
    TOPIC_LABELS should be a comma-separated list of topic strings.
    """
    env_labels = os.environ.get("TOPIC_LABELS", "")
    if env_labels:
        return [label.strip() for label in env_labels.split(",") if label.strip()]
    return DEFAULT_TOPIC_LABELS


# ── Zero-shot classification ──────────────────────────────────────────────────

def _classify(
    text: str,
    labels: List[str],
    threshold: float,
) -> List[Dict]:
    """
    Runs zero-shot classification and filters by threshold.

    Args:
        text:      Input text to classify.
        labels:    List of topic label strings.
        threshold: Minimum confidence score (0.0 - 1.0).

    Returns:
        Filtered and sorted list of { label, score } dicts.
    """
    classifier = get_topic_pipeline()

    try:
        # multi_label=True allows multiple topics per call
        result = classifier(
            text,
            candidate_labels=labels,
            multi_label=True,
            hypothesis_template="This customer call is about {}.",
        )

        # Build topic list above threshold
        topics = []
        for label, score in zip(result["labels"], result["scores"]):
            if score >= threshold:
                topics.append({
                    "label": label,
                    "score": round(float(score), 4),
                })

        # Sort by score descending
        topics.sort(key=lambda x: x["score"], reverse=True)

        logger.debug(
            "Topics above threshold (%.2f): %s",
            threshold,
            [(t["label"], t["score"]) for t in topics]
        )

        return topics

    except Exception as e:
        logger.error("Topic classification failed: %s", e)
        return []