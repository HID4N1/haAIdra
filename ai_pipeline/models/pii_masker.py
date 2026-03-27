# ai_pipeline/models/pii_masker.py
"""
PII Masker — detects and redacts Personally Identifiable Information
before persisting transcripts to the database.

PII types detected and masked:
  - Phone numbers    → [PHONE]
  - Credit card numbers → [CARD]
  - Email addresses  → [EMAIL]
  - National ID / CIN numbers → [ID]
  - Names (via NER)  → [NAME] (optional, disabled by default)

This runs AFTER transcription but BEFORE saving to DB.
The original audio is never modified — only the text transcript.

Implementation:
  - Regex patterns for structured PII (phone, card, email)
  - spaCy NER for unstructured PII (names) — optional
"""

import re
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)


# ── Regex patterns ────────────────────────────────────────────────────────────

# Phone: international and local formats
# Matches: +212-612-345678, 06 12 34 56 78, 0612345678, +1 (555) 123-4567
PHONE_PATTERN = re.compile(
    r"""
    (?:
        \+?[\d\s\-\(\)]{10,17}   # International formats
        |
        \b0[5-9]\d{8}\b          # French/Moroccan mobile (06, 07, etc.)
    )
    """,
    re.VERBOSE,
)

# Credit card: 13-19 digit numbers with optional separators
# Matches: 4111 1111 1111 1111, 4111-1111-1111-1111, 4111111111111111
CARD_PATTERN = re.compile(
    r"\b(?:\d[ \-]?){13,19}\b"
)

# Email addresses
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"
)

# Moroccan CIN / national ID (e.g. AB123456, A1234567)
CIN_PATTERN = re.compile(
    r"\b[A-Z]{1,2}\d{5,7}\b"
)

# IBAN (bank account number)
IBAN_PATTERN = re.compile(
    r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b"
)

# Compile all patterns with their replacement labels
PII_PATTERNS = [
    (EMAIL_PATTERN, "[EMAIL]"),    # Email before phone (emails contain @)
    (CARD_PATTERN,  "[CARD]"),     # Card before phone (cards are numeric)
    (IBAN_PATTERN,  "[IBAN]"),
    (PHONE_PATTERN, "[PHONE]"),
    (CIN_PATTERN,   "[ID]"),
]


# ── Text masking ──────────────────────────────────────────────────────────────

def mask_text(text: str, use_ner: bool = False) -> str:
    """
    Masks PII in a single text string using regex patterns.

    Args:
        text:    Input text (transcript segment or full transcript).
        use_ner: If True, also runs spaCy NER to mask person names.
                 Disabled by default — slower and less precise.

    Returns:
        Text with PII replaced by placeholder tokens.
    """
    if not text:
        return text

    masked = text

    # Apply regex patterns in order
    for pattern, replacement in PII_PATTERNS:
        masked = pattern.sub(replacement, masked)

    # Optional NER-based name masking
    if use_ner:
        masked = _mask_names_ner(masked)

    return masked


def mask_segments(segments: List[Dict], use_ner: bool = False) -> List[Dict]:
    """
    Masks PII in a list of transcript segments.

    Each segment is a dict: { start, end, speaker, text }
    Returns a new list of segments with text fields masked.
    The original segments are not modified (returns copies).

    Args:
        segments: List of transcript segment dicts.
        use_ner:  If True, uses spaCy NER for name detection.

    Returns:
        List of segments with PII masked in the text field.
    """
    masked_segments = []
    pii_found       = 0

    for seg in segments:
        original_text = seg.get("text", "")
        masked_text   = mask_text(original_text, use_ner=use_ner)

        if masked_text != original_text:
            pii_found += 1

        masked_segments.append({
            **seg,
            "text": masked_text,
        })

    if pii_found:
        logger.info("PII masked in %d/%d segments", pii_found, len(segments))

    return masked_segments


def has_pii(text: str) -> bool:
    """
    Returns True if the text contains any detectable PII.
    Useful for flagging calls that may need manual review.
    """
    for pattern, _ in PII_PATTERNS:
        if pattern.search(text):
            return True
    return False


# ── NER-based name masking (optional) ────────────────────────────────────────

_nlp = None  # spaCy model cache

def _mask_names_ner(text: str) -> str:
    """
    Uses spaCy NER to detect and mask person names.

    Only runs if spaCy and a language model are installed.
    Falls back gracefully if not available.

    Supported models:
      - fr_core_news_sm (French)
      - en_core_web_sm  (English)
      - xx_ent_wiki_sm  (Multilingual)
    """
    global _nlp

    if _nlp is None:
        try:
            import spacy
            # Try multilingual model first, fall back to French
            for model in ("xx_ent_wiki_sm", "fr_core_news_sm", "en_core_web_sm"):
                try:
                    _nlp = spacy.load(model)
                    logger.info("Loaded spaCy model: %s", model)
                    break
                except OSError:
                    continue

            if _nlp is None:
                logger.warning(
                    "No spaCy model found — name masking disabled. "
                    "Install: python -m spacy download fr_core_news_sm"
                )
                return text

        except ImportError:
            logger.warning("spaCy not installed — name masking disabled")
            return text

    try:
        doc    = _nlp(text)
        masked = text

        # Replace PERSON entities from right to left to preserve offsets
        for ent in reversed(doc.ents):
            if ent.label_ == "PER":
                masked = masked[:ent.start_char] + "[NAME]" + masked[ent.end_char:]

        return masked

    except Exception as e:
        logger.warning("NER masking failed: %s", e)
        return text


# ── Full transcript masking ───────────────────────────────────────────────────

def mask_transcript(transcript_data: Dict, use_ner: bool = False) -> Dict:
    """
    Applies PII masking to all text fields in a transcript dict.

    Args:
        transcript_data: Dict from transcription step with keys:
                         { language, wer, duration, segments }
        use_ner:         Enable NER-based name masking.

    Returns:
        New transcript dict with masked segments.
    """
    return {
        **transcript_data,
        "segments": mask_segments(
            transcript_data.get("segments", []),
            use_ner=use_ner,
        ),
    }