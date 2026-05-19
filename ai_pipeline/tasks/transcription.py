# ai_pipeline/tasks/transcription.py
"""
Transcription task — Step 1 of the AI pipeline.

Uses faster-whisper (optimized Whisper implementation) for ASR
and pyannote.audio for speaker diarization.

Pipeline:
  1. Download audio from S3 (or local storage in dev)
  2. Normalize to 16kHz mono WAV using ffmpeg
  3. Run Whisper ASR → raw transcript with timestamps
  4. Run pyannote diarization → speaker labels per time segment
  5. Merge Whisper segments with speaker labels
  6. Apply PII masking on transcript text
  7. Save to DB via psycopg2

Output shape saved to DB:
  segments: [
    {
      "start":   0.0,
      "end":     2.5,
      "speaker": "SPEAKER_00",
      "text":    "Bonjour, comment puis-je vous aider?"
    },
    ...
  ]
"""

import logging
import os
from typing import Dict, List, Optional, Tuple
from utils.s3    import get_audio_file, delete_tempfile
from utils.audio import normalize_audio, apply_vad, get_audio_metadata, cleanup_temp_files
from utils.db    import save_transcript, update_call_duration
from models.loaders   import get_whisper_model, get_diarization_model
from models.pii_masker import mask_segments

logger = logging.getLogger(__name__)


def run_transcription(call: Dict) -> Dict:
    """
    Main transcription entry point called by the pipeline orchestrator.

    Args:
        call: Dict from db.get_call() with keys:
              id, company_id, agent_id, language, s3_key, tenant_id

    Returns:
        transcript_data dict:
        {
            "language":  "fr",
            "wer":       0.0,
            "duration":  142.3,
            "segments":  [ { start, end, speaker, text }, ... ]
        }

    Raises:
        Exception: Any error is caught by the pipeline orchestrator
                   which will mark the job as failed and retry.
    """
    call_id = call["id"]
    s3_key  = call["s3_key"]

    logger.info("Starting transcription for call %s", call_id)

    audio_path  = None
    wav_path    = None
    vad_path    = None
    is_temp     = False

    try:
        # ── Step 1: Get audio file ────────────────────────────────────────────
        logger.info("Fetching audio: %s", s3_key)
        audio_path, is_temp = get_audio_file(s3_key)

        # Get metadata before normalization
        metadata = get_audio_metadata(audio_path)
        logger.info(
            "Audio metadata: %.1fs, %dHz, %dch, %s",
            metadata["duration"], metadata["sample_rate"],
            metadata["channels"], metadata["codec"],
        )

        # ── Step 2: Normalize audio ───────────────────────────────────────────
        logger.info("Normalizing audio to 16kHz mono WAV")
        wav_path = normalize_audio(audio_path)

        # ── Step 3: Apply VAD (optional) ──────────────────────────────────────
        # VAD removes silence to reduce Whisper hallucinations
        use_vad = os.environ.get("USE_VAD", "true").lower() == "true"
        if use_vad:
            vad_path = apply_vad(wav_path)
            process_path = vad_path if vad_path != wav_path else wav_path
        else:
            process_path = wav_path

        # ── Step 4: Whisper ASR ───────────────────────────────────────────────
        logger.info("Running Whisper ASR")
        whisper_segments, whisper_info = _run_whisper(process_path, call["language"])

        logger.info(
            "Whisper complete: lang=%s, duration=%.1fs, %d segments",
            whisper_info.language,
            whisper_info.duration,
            len(whisper_segments),
        )

        # ── Step 5: Speaker diarization (optional) ────────────────────────────
        diarization = _run_diarization(process_path)

        # ── Step 6: Merge segments with speaker labels ────────────────────────
        segments = _merge_segments(whisper_segments, diarization)

        # ── Step 7: Apply PII masking ─────────────────────────────────────────
        use_ner = os.environ.get("USE_NER_MASKING", "false").lower() == "true"
        segments = mask_segments(segments, use_ner=use_ner)

        transcript_data = {
            "language":  whisper_info.language or call["language"],
            "wer":       0.0,  # WER requires ground truth — set to 0 for AI transcription
            "duration":  whisper_info.duration or metadata["duration"],
            "segments":  segments,
        }

        # ── Step 8: Save to DB ────────────────────────────────────────────────
        save_transcript(
            call_id=call_id,
            language_detected=transcript_data["language"],
            word_error_rate=transcript_data["wer"],
            duration=transcript_data["duration"],
            segments=transcript_data["segments"],
        )
        update_call_duration(call_id, transcript_data["duration"])

        logger.info(
            "Transcription complete: call=%s, %d segments, duration=%.1fs",
            call_id, len(segments), transcript_data["duration"]
        )

        return transcript_data

    finally:
        # Always clean up temp files regardless of success/failure
        if is_temp and audio_path:
            delete_tempfile(audio_path)
        cleanup_temp_files(wav_path, vad_path)


# ── Whisper inference ─────────────────────────────────────────────────────────

def _run_whisper(audio_path: str, language_hint: str) -> Tuple:
    """
    Runs faster-whisper ASR on the audio file.

    Args:
        audio_path:    Path to 16kHz mono WAV file.
        language_hint: Language code from the call record (fr/en/ar).
                       Passed as a hint to Whisper to improve accuracy.

    Returns:
        (segments_generator, transcription_info) from faster-whisper.
    """
    model = get_whisper_model()

    # Map our language codes to Whisper's codes
    lang_map = {"fr": "fr", "en": "en", "ar": "ar"}
    language = lang_map.get(language_hint, None)  # None = auto-detect

    segments, info = model.transcribe(
        audio_path,
        language=language,
        beam_size=5,                # Higher = more accurate, slower
        word_timestamps=True,       # Needed for precise segment merging
        vad_filter=True,            # Built-in Whisper VAD (additional filtering)
        vad_parameters=dict(
            min_silence_duration_ms=500,  # Minimum silence to split segments
        ),
    )

    # Materialize the generator (faster-whisper is lazy)
    segments_list = list(segments)
    return segments_list, info


# ── Pyannote diarization ──────────────────────────────────────────────────────

def _run_diarization(audio_path: str) -> Optional[object]:
    """
    Runs pyannote speaker diarization.

    Returns pyannote Annotation object with speaker segments,
    or None if diarization is disabled (no HF_TOKEN).
    """
    diarization_model = get_diarization_model()

    if diarization_model is None:
        logger.info("Diarization disabled — using single speaker label")
        return None

    try:
        logger.info("Running pyannote diarization")
        diarization = diarization_model(audio_path)
        logger.info("Diarization complete")
        return diarization
    except Exception as e:
        logger.warning("Diarization failed: %s — continuing without speaker labels", e)
        return None


# ── Segment merging ───────────────────────────────────────────────────────────

def _merge_segments(
    whisper_segments: List,
    diarization: Optional[object],
) -> List[Dict]:
    """
    Merges Whisper transcript segments with pyannote speaker labels.

    For each Whisper segment, finds the speaker who was speaking
    at the midpoint of that segment using pyannote's annotation.

    If diarization is None, all segments get "SPEAKER_00" as default.

    Args:
        whisper_segments: List of faster-whisper Segment objects.
        diarization:      pyannote Annotation object or None.

    Returns:
        List of merged segment dicts:
        [{ "start", "end", "speaker", "text" }, ...]
    """
    merged = []

    for seg in whisper_segments:
        text = seg.text.strip()
        if not text:
            continue  # Skip empty segments

        # Find speaker at the midpoint of this segment
        if diarization is not None:
            midpoint = (seg.start + seg.end) / 2
            speaker  = _get_speaker_at(diarization, midpoint)
        else:
            speaker = "SPEAKER_00"

        merged.append({
            "start":   round(seg.start, 3),
            "end":     round(seg.end,   3),
            "speaker": speaker,
            "text":    text,
        })

    logger.debug("Merged %d segments with speaker labels", len(merged))
    return merged


def _get_speaker_at(diarization, time: float) -> str:
    """
    Returns the speaker label at a given time point from pyannote annotation.

    Args:
        diarization: pyannote Annotation object.
        time:        Time in seconds.

    Returns:
        Speaker label string (e.g. "SPEAKER_00") or "UNKNOWN".
    """
    try:
        from pyannote.core import Segment
        # Get all speakers active at the given time
        speakers = diarization.get_labels(Segment(time, time + 0.001))
        if speakers:
            return str(list(speakers)[0])
    except Exception:
        pass
    return "UNKNOWN"
