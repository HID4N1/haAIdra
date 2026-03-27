# ai_pipeline/utils/audio.py
"""
Audio utility — preprocessing audio files before ML inference.

Responsibilities:
  1. Normalize audio to 16kHz mono WAV (required by Whisper)
  2. Detect silence / voice activity (VAD) to skip empty segments
  3. Chunk long audio files for memory-efficient processing
  4. Extract audio metadata (duration, sample rate, channels)

Dependencies:
  - ffmpeg (system binary) — normalization and format conversion
  - pydub — audio manipulation in Python
  - webrtcvad — voice activity detection
"""

import os
import logging
import tempfile
import subprocess
from typing import List, Tuple

logger = logging.getLogger(__name__)

# Target format required by Whisper ASR
TARGET_SAMPLE_RATE = 16000   # 16kHz
TARGET_CHANNELS    = 1        # Mono
TARGET_FORMAT      = "wav"    # PCM WAV

# Chunking settings for long audio files
CHUNK_DURATION_SEC = 300      # 5-minute chunks
MAX_SILENCE_SEC    = 2.0      # Trim leading/trailing silence beyond 2s


def normalize_audio(input_path: str) -> str:
    """
    Converts any audio format (mp3, m4a, flac, ogg, wav) to
    16kHz mono PCM WAV using ffmpeg.

    Whisper requires 16kHz mono audio. This step ensures consistent
    input regardless of the original file format.

    Args:
        input_path: Path to the original audio file.

    Returns:
        Path to the normalized WAV file (temp file — caller must delete).

    Raises:
        RuntimeError: If ffmpeg is not installed or conversion fails.
    """
    # Create output temp file
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp.close()
    output_path = tmp.name

    cmd = [
        "ffmpeg",
        "-y",                          # Overwrite output without asking
        "-i", input_path,              # Input file
        "-ar", str(TARGET_SAMPLE_RATE), # Resample to 16kHz
        "-ac", str(TARGET_CHANNELS),   # Convert to mono
        "-f", TARGET_FORMAT,           # Output format: WAV
        "-acodec", "pcm_s16le",        # 16-bit PCM encoding
        output_path,
    ]

    try:
        logger.info("Normalizing audio: %s → %s", input_path, output_path)
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,  # 5-minute timeout
        )
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg error: {result.stderr}")

        size = os.path.getsize(output_path)
        logger.info("Normalized audio: %s (%d bytes)", output_path, size)
        return output_path

    except FileNotFoundError:
        raise RuntimeError(
            "ffmpeg not found. Install it: apt-get install ffmpeg"
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"ffmpeg timed out processing {input_path}")


def get_audio_duration(file_path: str) -> float:
    """
    Returns the duration of an audio file in seconds using ffprobe.

    Args:
        file_path: Path to audio file.

    Returns:
        Duration in seconds as float.
    """
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path,
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return float(result.stdout.strip())
    except Exception as e:
        logger.warning("Could not get duration for %s: %s", file_path, e)
        return 0.0


def get_audio_metadata(file_path: str) -> dict:
    """
    Extracts audio metadata using ffprobe.

    Returns:
        dict with keys: duration, sample_rate, channels, codec, format
    """
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_streams",
        "-show_format",
        file_path,
    ]
    try:
        import json
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        data   = json.loads(result.stdout)

        audio_stream = next(
            (s for s in data.get("streams", []) if s.get("codec_type") == "audio"),
            {}
        )
        fmt = data.get("format", {})

        return {
            "duration":    float(fmt.get("duration", 0)),
            "sample_rate": int(audio_stream.get("sample_rate", 0)),
            "channels":    int(audio_stream.get("channels", 0)),
            "codec":       audio_stream.get("codec_name", "unknown"),
            "format":      fmt.get("format_name", "unknown"),
            "size_bytes":  int(fmt.get("size", 0)),
        }
    except Exception as e:
        logger.warning("Could not get metadata for %s: %s", file_path, e)
        return {
            "duration": 0.0, "sample_rate": 0,
            "channels": 0, "codec": "unknown",
            "format": "unknown", "size_bytes": 0,
        }


def chunk_audio(file_path: str, chunk_duration: int = CHUNK_DURATION_SEC) -> List[str]:
    """
    Splits a long audio file into fixed-duration chunks.

    Used for very long calls (>30 min) to avoid memory issues during
    Whisper inference. Each chunk is processed independently.

    Args:
        file_path:       Path to the normalized WAV file.
        chunk_duration:  Duration of each chunk in seconds (default: 5 min).

    Returns:
        List of paths to chunk files (temp files — caller must delete all).
    """
    duration = get_audio_duration(file_path)

    # Short file — no chunking needed
    if duration <= chunk_duration:
        return [file_path]

    chunks     = []
    start_time = 0
    chunk_idx  = 0

    logger.info(
        "Chunking audio (%.1f sec) into %d-sec chunks",
        duration, chunk_duration
    )

    while start_time < duration:
        tmp = tempfile.NamedTemporaryFile(
            suffix=f"_chunk{chunk_idx}.wav", delete=False
        )
        tmp.close()
        chunk_path = tmp.name

        cmd = [
            "ffmpeg", "-y",
            "-i", file_path,
            "-ss", str(start_time),          # Start offset
            "-t",  str(chunk_duration),      # Duration
            "-ar", str(TARGET_SAMPLE_RATE),
            "-ac", str(TARGET_CHANNELS),
            "-f",  TARGET_FORMAT,
            "-acodec", "pcm_s16le",
            chunk_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            chunks.append(chunk_path)
            logger.debug("Created chunk %d: %s", chunk_idx, chunk_path)
        else:
            logger.warning("Failed to create chunk %d: %s", chunk_idx, result.stderr)

        start_time += chunk_duration
        chunk_idx  += 1

    logger.info("Created %d chunks", len(chunks))
    return chunks


def apply_vad(file_path: str, aggressiveness: int = 2) -> str:
    """
    Applies Voice Activity Detection (VAD) to remove silence.

    Uses webrtcvad to detect and remove non-speech segments.
    This reduces Whisper hallucinations on silent audio.

    Args:
        file_path:     Path to 16kHz mono WAV file.
        aggressiveness: VAD aggressiveness 0-3 (3 = most aggressive silence removal).

    Returns:
        Path to VAD-filtered WAV file (temp file — caller must delete).
        Returns original file path if webrtcvad is not installed.
    """
    try:
        import webrtcvad
        import wave
        import struct
    except ImportError:
        logger.warning("webrtcvad not installed — skipping VAD")
        return file_path

    try:
        vad         = webrtcvad.Vad(aggressiveness)
        frame_ms    = 30   # 30ms frames (webrtcvad requirement)
        frame_bytes = int(TARGET_SAMPLE_RATE * 2 * frame_ms / 1000)  # 16-bit = 2 bytes

        with wave.open(file_path, "rb") as wf:
            sample_rate = wf.getframerate()
            raw_audio   = wf.readframes(wf.getnframes())

        if sample_rate != TARGET_SAMPLE_RATE:
            logger.warning("VAD expects 16kHz, got %dHz — skipping", sample_rate)
            return file_path

        # Split into frames and filter out silence
        speech_frames = []
        for i in range(0, len(raw_audio) - frame_bytes, frame_bytes):
            frame = raw_audio[i:i + frame_bytes]
            if len(frame) == frame_bytes and vad.is_speech(frame, TARGET_SAMPLE_RATE):
                speech_frames.append(frame)

        if not speech_frames:
            logger.warning("VAD removed all frames — returning original")
            return file_path

        # Write filtered audio to temp file
        tmp = tempfile.NamedTemporaryFile(suffix="_vad.wav", delete=False)
        tmp.close()

        with wave.open(tmp.name, "wb") as out:
            out.setnchannels(TARGET_CHANNELS)
            out.setsampwidth(2)  # 16-bit
            out.setframerate(TARGET_SAMPLE_RATE)
            out.writeframes(b"".join(speech_frames))

        logger.info(
            "VAD: %d → %d frames (%.1f%% speech)",
            len(raw_audio) // frame_bytes,
            len(speech_frames),
            len(speech_frames) / (len(raw_audio) // frame_bytes) * 100,
        )
        return tmp.name

    except Exception as e:
        logger.warning("VAD failed: %s — returning original", e)
        return file_path


def cleanup_temp_files(*paths: str):
    """
    Safely deletes multiple temporary audio files.
    Logs warnings for files that can't be deleted but does not raise.
    """
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.unlink(path)
                logger.debug("Deleted temp file: %s", path)
            except OSError as e:
                logger.warning("Could not delete %s: %s", path, e)