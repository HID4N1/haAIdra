# ai_pipeline/models/loaders.py
"""
ML model loaders — singleton pattern with lazy loading and caching.

Loading large ML models (Whisper, HuggingFace Transformers) takes 10-30s
and uses several GB of RAM. We load each model once and cache it in memory
for the lifetime of the Celery worker process.

Models loaded:
  - Whisper (openai/whisper-large-v3) — ASR transcription
  - pyannote (pyannote/speaker-diarization-3.1) — speaker diarization
  - Sentiment (cardiffnlp/twitter-xlm-roberta-base-sentiment) — multilingual
  - BART-MNLI (facebook/bart-large-mnli) — zero-shot topic classification
  - LLM (mistralai/Mistral-7B-Instruct or local ollama) — summarization

Environment variables:
  WHISPER_MODEL_SIZE    — tiny|base|small|medium|large-v3 (default: large-v3)
  SENTIMENT_MODEL       — HuggingFace model ID
  TOPIC_MODEL           — HuggingFace model ID
  LLM_MODEL             — HuggingFace model ID or "ollama:modelname"
  HF_TOKEN              — HuggingFace API token (required for gated models)
  USE_GPU               — true|false (default: auto-detect)
  DEVICE                — cuda|cpu|mps (default: auto-detect)
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Device detection ──────────────────────────────────────────────────────────

def get_device() -> str:
    """
    Auto-detects the best available compute device.
    Priority: CUDA GPU → Apple MPS → CPU
    Can be overridden with DEVICE env var.
    """
    override = os.environ.get("DEVICE", "").lower()
    if override in ("cuda", "cpu", "mps"):
        logger.info("Using device (override): %s", override)
        return override

    try:
        import torch
        if torch.cuda.is_available():
            device = "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            device = "mps"
        else:
            device = "cpu"
        logger.info("Auto-detected device: %s", device)
        return device
    except ImportError:
        logger.warning("torch not available — defaulting to cpu")
        return "cpu"


# ── Model cache ───────────────────────────────────────────────────────────────

# Global cache — models are loaded once per worker process
_whisper_model     = None
_diarization_model = None
_sentiment_model   = None
_sentiment_tokenizer = None
_topic_pipeline    = None
_llm_pipeline      = None


# ── Whisper ───────────────────────────────────────────────────────────────────

def get_whisper_model():
    """
    Loads and caches the Whisper ASR model.

    Model size is controlled by WHISPER_MODEL_SIZE env var.
    Larger models are more accurate but slower and use more memory:
      - tiny:     ~40MB,  fastest, lowest accuracy
      - base:     ~75MB,  fast
      - small:    ~250MB, good balance
      - medium:   ~800MB, better accuracy
      - large-v3: ~3GB,   best accuracy (recommended for production)

    Returns:
        whisper.WhisperModel instance (faster-whisper)
    """
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    try:
        from faster_whisper import WhisperModel

        model_size = os.environ.get("WHISPER_MODEL_SIZE", "large-v3")
        device     = get_device()

        # faster-whisper uses "int8" compute type on CPU for efficiency
        # and "float16" on GPU for speed
        compute_type = "int8" if device == "cpu" else "float16"

        logger.info(
            "Loading Whisper model: %s on %s (%s)",
            model_size, device, compute_type
        )

        _whisper_model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
        )

        logger.info("Whisper model loaded successfully")
        return _whisper_model

    except ImportError:
        raise ImportError(
            "faster-whisper not installed. Run: pip install faster-whisper"
        )
    except Exception as e:
        logger.error("Failed to load Whisper model: %s", e)
        raise


# ── Pyannote diarization ──────────────────────────────────────────────────────

def get_diarization_model():
    """
    Loads and caches the pyannote speaker diarization model.

    Requires a HuggingFace token (HF_TOKEN) to download the gated model.
    The model identifies who is speaking when in the audio (SPEAKER_00, etc.)
    and is used to label transcript segments with speaker names.

    Returns:
        pyannote.audio.Pipeline instance or None if HF_TOKEN not set.
    """
    global _diarization_model
    if _diarization_model is not None:
        return _diarization_model

    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        logger.warning(
            "HF_TOKEN not set — speaker diarization disabled. "
            "Set HF_TOKEN to enable speaker labels."
        )
        return None

    try:
        from pyannote.audio import Pipeline
        import torch

        logger.info("Loading pyannote diarization model...")
        _diarization_model = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=hf_token,
        )

        device = get_device()
        if device in ("cuda", "mps"):
            _diarization_model = _diarization_model.to(
                torch.device(device)
            )

        logger.info("Pyannote diarization model loaded successfully")
        return _diarization_model

    except ImportError:
        logger.warning("pyannote.audio not installed — diarization disabled")
        return None
    except Exception as e:
        logger.error("Failed to load diarization model: %s", e)
        return None


# ── Sentiment ─────────────────────────────────────────────────────────────────

def get_sentiment_model():
    """
    Loads and caches the sentiment analysis model and tokenizer.

    Default model: cardiffnlp/twitter-xlm-roberta-base-sentiment
    This model supports multiple languages (fr, en, ar) which matches
    CallSight's language support.

    Returns:
        (pipeline, tokenizer) tuple from HuggingFace transformers.
    """
    global _sentiment_model, _sentiment_tokenizer
    if _sentiment_model is not None:
        return _sentiment_model, _sentiment_tokenizer

    try:
        from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

        model_name = os.environ.get(
            "SENTIMENT_MODEL",
            "cardiffnlp/twitter-xlm-roberta-base-sentiment"
        )
        device = get_device()
        device_id = 0 if device == "cuda" else -1  # transformers uses -1 for CPU

        logger.info("Loading sentiment model: %s on %s", model_name, device)

        _sentiment_tokenizer = AutoTokenizer.from_pretrained(model_name)
        _sentiment_model     = pipeline(
            "sentiment-analysis",
            model=model_name,
            tokenizer=_sentiment_tokenizer,
            device=device_id,
            truncation=True,
            max_length=512,
        )

        logger.info("Sentiment model loaded successfully")
        return _sentiment_model, _sentiment_tokenizer

    except ImportError:
        raise ImportError(
            "transformers not installed. Run: pip install transformers"
        )
    except Exception as e:
        logger.error("Failed to load sentiment model: %s", e)
        raise


# ── Topic classification (BART-MNLI) ─────────────────────────────────────────

def get_topic_pipeline():
    """
    Loads and caches the zero-shot classification pipeline.

    Uses facebook/bart-large-mnli for zero-shot topic detection.
    Zero-shot means no training data needed — we just define the
    topic labels we want and the model scores each one.

    Returns:
        HuggingFace zero-shot-classification pipeline.
    """
    global _topic_pipeline
    if _topic_pipeline is not None:
        return _topic_pipeline

    try:
        from transformers import pipeline

        model_name = os.environ.get(
            "TOPIC_MODEL",
            "facebook/bart-large-mnli"
        )
        device    = get_device()
        device_id = 0 if device == "cuda" else -1

        logger.info("Loading topic model: %s on %s", model_name, device)

        _topic_pipeline = pipeline(
            "zero-shot-classification",
            model=model_name,
            device=device_id,
        )

        logger.info("Topic model loaded successfully")
        return _topic_pipeline

    except ImportError:
        raise ImportError(
            "transformers not installed. Run: pip install transformers"
        )
    except Exception as e:
        logger.error("Failed to load topic model: %s", e)
        raise


# ── LLM (summarization) ───────────────────────────────────────────────────────

def get_llm_pipeline():
    """
    Loads and caches the LLM for call summarization.

    Supports two modes:
    1. HuggingFace model (default): loads locally, requires GPU for good performance
    2. Ollama (LLM_MODEL=ollama:mistral): uses a local Ollama server (lighter, CPU-friendly)

    Default: ollama:mistral (recommended for development without GPU)
    Production: mistralai/Mistral-7B-Instruct-v0.2 or similar

    Returns:
        callable that takes a prompt string and returns a completion string.
    """
    global _llm_pipeline
    if _llm_pipeline is not None:
        return _llm_pipeline

    model_config = os.environ.get("LLM_MODEL", "ollama:mistral")

    # ── Ollama mode ───────────────────────────────────────────────────────────
    if model_config.startswith("ollama:"):
        model_name = model_config.split(":", 1)[1]
        ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")

        logger.info("Using Ollama LLM: %s @ %s", model_name, ollama_url)

        def ollama_generate(prompt: str, max_tokens: int = 512) -> str:
            import requests
            response = requests.post(
                f"{ollama_url}/api/generate",
                json={
                    "model":  model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"num_predict": max_tokens},
                },
                timeout=120,
            )
            response.raise_for_status()
            return response.json().get("response", "")

        _llm_pipeline = ollama_generate
        return _llm_pipeline

    # ── HuggingFace mode ──────────────────────────────────────────────────────
    try:
        from transformers import pipeline, AutoTokenizer
        import torch

        device    = get_device()
        device_id = 0 if device == "cuda" else -1
        hf_token  = os.environ.get("HF_TOKEN")

        logger.info("Loading LLM: %s on %s", model_config, device)

        tokenizer = AutoTokenizer.from_pretrained(
            model_config, token=hf_token
        )
        hf_pipe   = pipeline(
            "text-generation",
            model=model_config,
            tokenizer=tokenizer,
            device=device_id,
            token=hf_token,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        )

        def hf_generate(prompt: str, max_tokens: int = 512) -> str:
            result = hf_pipe(
                prompt,
                max_new_tokens=max_tokens,
                do_sample=False,
                temperature=0.1,
            )
            return result[0]["generated_text"][len(prompt):]

        _llm_pipeline = hf_generate
        logger.info("LLM loaded successfully")
        return _llm_pipeline

    except ImportError:
        raise ImportError(
            "transformers not installed. Run: pip install transformers torch"
        )
    except Exception as e:
        logger.error("Failed to load LLM: %s", e)
        raise