# ai_pipeline/tasks/sentiment.py
"""
Sentiment analysis task — Step 2 of the AI pipeline.

Runs per-segment sentiment analysis on the transcript using
HuggingFace Transformers (cardiffnlp/twitter-xlm-roberta-base-sentiment).

The model supports multilingual input (fr, en, ar) which matches
CallSight's supported languages.

Pipeline:
  1. Receive transcript segments from Step 1
  2. Run sentiment classification on each segment text
  3. Compute overall sentiment (weighted by segment duration)
  4. Save results to DB

Output shape:
  overall_label: "positive" | "neutral" | "negative"
  overall_score: float (0.0 - 1.0, confidence of the overall label)
  segments: [
    {
      "start": 0.0, "end": 2.5,
      "label": "positive", "score": 0.92
    },
    ...
  ]
"""

import logging
from typing import Dict, List, Tuple

from utils.db    import save_sentiment
from models.loaders import get_sentiment_model

logger = logging.getLogger(__name__)

# Map model output labels to our standard labels
# cardiffnlp model outputs: "positive", "neutral", "negative"
LABEL_MAP = {
    "positive": "positive",
    "neutral":  "neutral",
    "negative": "negative",
    # Handle variations some models use
    "LABEL_0":  "negative",
    "LABEL_1":  "neutral",
    "LABEL_2":  "positive",
    "POS":      "positive",
    "NEU":      "neutral",
    "NEG":      "negative",
}

# Minimum text length to run sentiment on (skip very short segments)
MIN_TEXT_LENGTH = 5


def run_sentiment(call: Dict, transcript_data: Dict) -> Dict:
    """
    Main sentiment entry point called by the pipeline orchestrator.

    Args:
        call:            Dict from db.get_call()
        transcript_data: Dict from run_transcription() with segments

    Returns:
        sentiment_data dict:
        {
            "label":    "positive",
            "score":    0.78,
            "segments": [ { start, end, label, score }, ... ]
        }
    """
    call_id  = call["id"]
    segments = transcript_data.get("segments", [])

    logger.info("Starting sentiment analysis for call %s (%d segments)",
                call_id, len(segments))

    if not segments:
        logger.warning("No segments to analyze for call %s", call_id)
        result = {"label": "neutral", "score": 0.5, "segments": []}
        save_sentiment(call_id, "neutral", 0.5, [])
        return result

    # ── Run per-segment sentiment ─────────────────────────────────────────────
    segment_results = _analyse_segments(segments)

    # ── Compute overall sentiment ─────────────────────────────────────────────
    overall_label, overall_score = _compute_overall(segments, segment_results)

    sentiment_data = {
        "label":    overall_label,
        "score":    overall_score,
        "segments": segment_results,
    }

    # ── Save to DB ────────────────────────────────────────────────────────────
    save_sentiment(
        call_id=call_id,
        overall_label=overall_label,
        overall_score=overall_score,
        segments=segment_results,
    )

    logger.info(
        "Sentiment complete: call=%s, overall=%s (%.2f), %d segments",
        call_id, overall_label, overall_score, len(segment_results)
    )

    return sentiment_data


# ── Segment analysis ──────────────────────────────────────────────────────────

def _analyse_segments(segments: List[Dict]) -> List[Dict]:
    """
    Runs sentiment classification on each transcript segment.

    Batches segments for efficiency — running the model once per
    segment would be very slow for long calls.

    Args:
        segments: List of { start, end, speaker, text } dicts.

    Returns:
        List of { start, end, label, score } dicts.
    """
    model, _ = get_sentiment_model()

    # Filter segments with enough text to analyze
    valid_indices = [
        i for i, seg in enumerate(segments)
        if len(seg.get("text", "").strip()) >= MIN_TEXT_LENGTH
    ]
    valid_texts = [segments[i]["text"] for i in valid_indices]

    if not valid_texts:
        return []

    # Run inference in batches to avoid OOM on long calls
    batch_size = int(32)
    all_results = []

    for i in range(0, len(valid_texts), batch_size):
        batch = valid_texts[i:i + batch_size]
        try:
            batch_results = model(batch, truncation=True, max_length=512)
            all_results.extend(batch_results)
        except Exception as e:
            logger.warning("Batch %d failed: %s — using neutral fallback", i, e)
            all_results.extend([{"label": "neutral", "score": 0.5}] * len(batch))

    # Map results back to segment indices
    result_map = {}
    for idx, (seg_idx, result) in enumerate(zip(valid_indices, all_results)):
        result_map[seg_idx] = result

    # Build output with all segments (neutral fallback for skipped ones)
    output = []
    for i, seg in enumerate(segments):
        result = result_map.get(i, {"label": "neutral", "score": 0.5})
        label  = LABEL_MAP.get(result["label"], "neutral")
        score  = round(float(result["score"]), 4)

        output.append({
            "start":   seg["start"],
            "end":     seg["end"],
            "label":   label,
            "score":   score,
        })

    return output


# ── Overall sentiment computation ─────────────────────────────────────────────

def _compute_overall(
    segments: List[Dict],
    segment_results: List[Dict],
) -> Tuple[str, float]:
    """
    Computes the overall call sentiment by weighting each segment's
    sentiment by its duration.

    Longer segments have more influence on the overall sentiment than
    very short ones. This prevents a single word from skewing the result.

    Args:
        segments:        Original transcript segments (with duration info).
        segment_results: Sentiment results per segment.

    Returns:
        (overall_label, overall_score) tuple.
    """
    if not segment_results:
        return "neutral", 0.5

    # Accumulate weighted scores per label
    label_weights = {"positive": 0.0, "neutral": 0.0, "negative": 0.0}
    total_duration = 0.0

    for seg, result in zip(segments, segment_results):
        duration = max(seg["end"] - seg["start"], 0.1)  # Min 0.1s weight
        label    = result["label"]
        score    = result["score"]

        label_weights[label] += duration * score
        total_duration       += duration

    if total_duration == 0:
        return "neutral", 0.5

    # Normalize weights
    for label in label_weights:
        label_weights[label] /= total_duration

    # Overall label = highest weighted label
    overall_label = max(label_weights, key=label_weights.get)
    overall_score = round(label_weights[overall_label], 4)

    logger.debug(
        "Overall sentiment: %s (%.2f) | weights: %s",
        overall_label, overall_score,
        {k: round(v, 3) for k, v in label_weights.items()}
    )

    return overall_label, overall_score