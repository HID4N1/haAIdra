"""
S3 utility — downloads audio files from AWS S3 for AI processing.

The AI pipeline runs in a separate container and needs to download
audio files from S3 before processing them with Whisper/ML models.

Flow:
  1. Receive s3_key from the pipeline task
  2. Download bytes from S3 into memory (small files) or temp file (large)
  3. Return file path or bytes for downstream processing
"""

import os
import boto3
import tempfile
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# ── S3 client (singleton) ─────────────────────────────────────────────────────

def _get_s3_client():
    """
    Returns a boto3 S3 client using environment variables.
    Called once per task — boto3 handles connection pooling internally.
    """
    return boto3.client(
        "s3",
        region_name=os.environ.get("AWS_S3_REGION_NAME", "eu-west-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


# ── Download functions ────────────────────────────────────────────────────────

def download_to_tempfile(s3_key: str, suffix: str = ".mp3") -> str:
    """
    Downloads an S3 object to a temporary file on disk.

    Use this for large audio files that Whisper needs to read from disk.
    The caller is responsible for deleting the temp file after use.

    Args:
        s3_key:  S3 object key (e.g. "tenant_id/calls/call_id/audio.mp3")
        suffix:  File extension for the temp file (default: .mp3)

    Returns:
        Path to the temporary file on disk.

    Raises:
        FileNotFoundError: If the S3 object does not exist.
        RuntimeError:      If the download fails for any other reason.
    """
    bucket = os.environ.get("AWS_STORAGE_BUCKET_NAME", "callsight-audio")
    client = _get_s3_client()

    # Create a named temp file that persists after closing
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)

    try:
        logger.info("Downloading s3://%s/%s → %s", bucket, s3_key, tmp.name)
        client.download_fileobj(bucket, s3_key, tmp)
        tmp.flush()
        tmp.close()
        logger.info("Download complete: %s (%d bytes)", tmp.name, os.path.getsize(tmp.name))
        return tmp.name

    except ClientError as e:
        tmp.close()
        os.unlink(tmp.name)
        error_code = e.response["Error"]["Code"]
        if error_code == "NoSuchKey":
            raise FileNotFoundError(f"S3 object not found: {s3_key}") from e
        raise RuntimeError(f"S3 download failed for {s3_key}: {e}") from e

    except Exception as e:
        tmp.close()
        if os.path.exists(tmp.name):
            os.unlink(tmp.name)
        raise RuntimeError(f"Unexpected error downloading {s3_key}: {e}") from e


def download_to_bytes(s3_key: str) -> bytes:
    """
    Downloads an S3 object directly into memory as bytes.

    Use this for small files or when you need raw bytes
    (e.g. computing checksums, passing to in-memory processors).

    Args:
        s3_key: S3 object key

    Returns:
        File contents as bytes.
    """
    bucket = os.environ.get("AWS_STORAGE_BUCKET_NAME", "callsight-audio")
    client = _get_s3_client()

    try:
        logger.info("Downloading s3://%s/%s to memory", bucket, s3_key)
        response = client.get_object(Bucket=bucket, Key=s3_key)
        data     = response["Body"].read()
        logger.info("Downloaded %d bytes from %s", len(data), s3_key)
        return data

    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "NoSuchKey":
            raise FileNotFoundError(f"S3 object not found: {s3_key}") from e
        raise RuntimeError(f"S3 download failed for {s3_key}: {e}") from e


def delete_tempfile(path: str):
    """
    Safely deletes a temporary file created by download_to_tempfile.
    Logs a warning if the file doesn't exist but does not raise.
    """
    try:
        if path and os.path.exists(path):
            os.unlink(path)
            logger.debug("Deleted temp file: %s", path)
    except OSError as e:
        logger.warning("Failed to delete temp file %s: %s", path, e)


def get_local_path(s3_key: str) -> str:
    """
    Returns the local filesystem path for an S3 key when running in
    development mode (DEBUG=True) with LocalStorage.

    In development, files are stored at MEDIA_ROOT/{s3_key} instead of S3.
    The pipeline checks this first before attempting an S3 download.

    Args:
        s3_key: S3 object key

    Returns:
        Absolute local path if it exists, else None.
    """
    media_root = os.environ.get("MEDIA_ROOT", "mediafiles")
    local_path = os.path.join(media_root, s3_key)
    if os.path.exists(local_path):
        logger.info("Using local file: %s", local_path)
        return local_path
    return None


def get_audio_file(s3_key: str) -> str:
    """
    Smart audio file resolver — checks local storage first, falls back to S3.

    This is the main entry point used by pipeline tasks.
    Returns a path to the audio file on disk (either local or downloaded from S3).

    The caller must call delete_tempfile(path) after processing ONLY if
    the file was downloaded from S3 (i.e. not a local path).

    Returns:
        (path, is_temp) tuple where is_temp=True means caller should delete after use.
    """
    # Development: check local storage first
    local = get_local_path(s3_key)
    if local:
        return local, False  # Don't delete local files

    # Production: download from S3
    ext  = os.path.splitext(s3_key)[-1] or ".mp3"
    path = download_to_tempfile(s3_key, suffix=ext)
    return path, True  # Caller should delete after use