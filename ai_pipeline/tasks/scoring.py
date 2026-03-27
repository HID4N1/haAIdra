# ai_pipeline/tasks/scoring.py
"""
Quality scoring task — Step 4 of the AI pipeline.

Computes a quality score for the call based on 6 weighted criteria:
  1. Accueil     — greeting and opening (was the customer welcomed properly?)
  2. Empathie    — empathy shown (did the agent acknowledge the customer's feelings?)
  3. Resolution  — problem resolution (was the issue resolved?)
  4. Langage     — language quality (professional tone, no slang or rudeness?)
  5. Conformité  — script compliance (did the agent follow the required script?)
  6. Clôture     — closing (was the call closed professionally?)

Scoring approach:
  Each criterion is scored using a combination of:
  - Keyword/phrase detection in the transcript
  - Sentiment analysis results (especially for Empathie)
  - Resolution status indicators
  - Call structure analysis (opening/closing segments)

The raw scores are then weighted by the company's ScoringConfig
to compute the final total score (0-100).

Note: This is a rule-based scoring engine. For better accuracy,
      replace the criterion functions with fine-tuned ML classifiers.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple

from utils.db import save_score, get_scoring_config

logger = logging.getLogger(__name__)

# ── Keyword lists for rule-based scoring ─────────────────────────────────────
# These are French-first since CallSight targets French-speaking markets,
# with English fallbacks.

GREETING_KEYWORDS = [
    # French
    "bonjour", "bonsoir", "bienvenue", "comment puis-je",
    "comment puis je", "je m'appelle", "je mappelle",
    "service client", "à votre service", "a votre service",
    # English
    "hello", "good morning", "good afternoon", "how can i help",
    "my name is", "this is", "speaking",
    # Arabic
    "مرحبا", "السلام", "أهلا", "كيف يمكنني مساعدتك",
]

EMPATHY_KEYWORDS = [
    # French
    "je comprends", "je suis désolé", "je suis desole",
    "excusez-moi", "je vous comprends", "c'est normal",
    "ne vous inquiétez pas", "je vais vous aider",
    "je comprends votre frustration", "tout à fait",
    # English
    "i understand", "i'm sorry", "i apologize", "i can see",
    "that must be frustrating", "i'll help you",
    # Arabic
    "أفهم", "آسف", "أعتذر", "سأساعدك",
]

RESOLUTION_KEYWORDS = [
    # French
    "résolu", "réglé", "corrigé", "traité", "effectué",
    "c'est fait", "votre problème est résolu",
    "je vais traiter", "nous allons", "je vous confirme",
    # English
    "resolved", "fixed", "done", "completed",
    "i've taken care", "problem solved",
]

CLOSING_KEYWORDS = [
    # French
    "bonne journée", "bonne soirée", "au revoir", "à bientôt",
    "merci de votre appel", "n'hésitez pas",
    "est-ce que je peux vous aider", "autre chose",
    # English
    "have a good day", "goodbye", "thank you for calling",
    "is there anything else",
    # Arabic
    "وداعا", "مع السلامة", "شكرا على اتصالك",
]

NEGATIVE_LANGUAGE = [
    # French — rude or unprofessional language
    "c'est pas mon problème", "je sais pas",
    "je m'en fous", "débrouillez-vous",
    "c'est comme ça", "je peux rien faire",
    # English
    "not my problem", "i don't know", "i can't help",
    "that's not possible", "calm down",
]

COMPLIANCE_REQUIRED = [
    # Standard compliance phrases agents must say
    "puis-je avoir votre numéro",
    "pouvez-vous confirmer",
    "pour des raisons de sécurité",
    "je vais noter",
    "un numéro de référence",
    "numéro de dossier",
]


def run_scoring(
    call: Dict,
    transcript_data: Dict,
    sentiment_data: Dict,
) -> Dict:
    """
    Main scoring entry point called by the pipeline orchestrator.

    Args:
        call:            Dict from db.get_call()
        transcript_data: Dict from run_transcription()
        sentiment_data:  Dict from run_sentiment()

    Returns:
        score_data dict:
        {
            "config_id":   "uuid or None",
            "accueil":     18.5,
            "empathie":    16.0,
            "resolution":  14.0,
            "langage":     13.5,
            "conformite":  12.0,
            "cloture":     9.0,
            "total":       83.0,
        }
    """
    call_id    = call["id"]
    company_id = call["company_id"]
    agent_id   = call["agent_id"]
    segments   = transcript_data.get("segments", [])

    logger.info("Starting quality scoring for call %s", call_id)

    # ── Get scoring config ────────────────────────────────────────────────────
    config    = get_scoring_config(company_id)
    config_id = config["id"] if config else None

    # Default weights if no config found
    weights = {
        "accueil":    config["accueil_weight"]    if config else 0.20,
        "empathie":   config["empathie_weight"]   if config else 0.20,
        "resolution": config["resolution_weight"] if config else 0.20,
        "langage":    config["langage_weight"]    if config else 0.15,
        "conformite": config["conformite_weight"] if config else 0.15,
        "cloture":    config["cloture_weight"]    if config else 0.10,
    }

    # Max score per criteria (weights × 100)
    maxes = {k: round(float(v) * 100, 2) for k, v in weights.items()}

    # ── Extract text for analysis ─────────────────────────────────────────────
    full_text    = " ".join(s.get("text", "") for s in segments).lower()
    opening_text = _get_opening_text(segments)   # First 30 seconds
    closing_text = _get_closing_text(segments)   # Last 30 seconds
    agent_text   = _get_agent_text(segments)     # Only agent segments

    # ── Score each criterion ──────────────────────────────────────────────────
    accueil_score    = _score_accueil(opening_text, maxes["accueil"])
    empathie_score   = _score_empathie(agent_text, sentiment_data, maxes["empathie"])
    resolution_score = _score_resolution(full_text, sentiment_data, maxes["resolution"])
    langage_score    = _score_langage(agent_text, maxes["langage"])
    conformite_score = _score_conformite(agent_text, maxes["conformite"])
    cloture_score    = _score_cloture(closing_text, maxes["cloture"])

    total = round(
        accueil_score + empathie_score + resolution_score
        + langage_score + conformite_score + cloture_score, 2
    )

    score_data = {
        "config_id":    config_id,
        "accueil":      accueil_score,
        "accueil_max":  maxes["accueil"],
        "empathie":     empathie_score,
        "empathie_max": maxes["empathie"],
        "resolution":   resolution_score,
        "resolution_max": maxes["resolution"],
        "langage":      langage_score,
        "langage_max":  maxes["langage"],
        "conformite":   conformite_score,
        "conformite_max": maxes["conformite"],
        "cloture":      cloture_score,
        "cloture_max":  maxes["cloture"],
        "total":        total,
    }

    # ── Save to DB ────────────────────────────────────────────────────────────
    save_score(
        call_id=call_id,
        config_id=config_id,
        accueil=accueil_score,     accueil_max=maxes["accueil"],
        empathie=empathie_score,   empathie_max=maxes["empathie"],
        resolution=resolution_score, resolution_max=maxes["resolution"],
        langage=langage_score,     langage_max=maxes["langage"],
        conformite=conformite_score, conformite_max=maxes["conformite"],
        cloture=cloture_score,     cloture_max=maxes["cloture"],
        total=total,
        ai_total=total,
        scored_by="ai",
    )

    logger.info("Scoring complete: call=%s total=%.2f/100", call_id, total)
    return score_data


# ── Criterion scoring functions ───────────────────────────────────────────────

def _score_accueil(opening_text: str, max_score: float) -> float:
    """
    Scores the greeting/opening of the call.
    Checks if the agent used proper greeting phrases in the first 30s.
    """
    if not opening_text:
        return 0.0

    score = 0.0
    text  = opening_text.lower()

    # Full score for proper greeting
    if any(kw in text for kw in GREETING_KEYWORDS):
        score += 0.7 * max_score

    # Bonus for introducing themselves
    if any(kw in text for kw in ["je m'appelle", "my name is", "speaking"]):
        score += 0.3 * max_score

    return round(min(score, max_score), 2)


def _score_empathie(
    agent_text: str,
    sentiment_data: Dict,
    max_score: float,
) -> float:
    """
    Scores the agent's empathy throughout the call.
    Combines keyword detection with sentiment analysis of the customer.
    """
    if not agent_text:
        return 0.0

    score = 0.0
    text  = agent_text.lower()

    # Keyword-based empathy detection (up to 60% of max)
    empathy_count = sum(1 for kw in EMPATHY_KEYWORDS if kw in text)
    keyword_score = min(empathy_count / 3, 1.0) * 0.6 * max_score
    score        += keyword_score

    # Sentiment-based bonus — if customer sentiment is positive, agent did well
    overall_label = sentiment_data.get("label", "neutral")
    if overall_label == "positive":
        score += 0.4 * max_score
    elif overall_label == "neutral":
        score += 0.2 * max_score
    # negative sentiment → no bonus

    return round(min(score, max_score), 2)


def _score_resolution(
    full_text: str,
    sentiment_data: Dict,
    max_score: float,
) -> float:
    """
    Scores how well the agent resolved the customer's issue.
    Combines resolution keyword detection with call outcome signals.
    """
    if not full_text:
        return 0.0

    score = 0.0
    text  = full_text.lower()

    # Resolution keyword detection (up to 50%)
    resolution_count = sum(1 for kw in RESOLUTION_KEYWORDS if kw in text)
    if resolution_count > 0:
        score += min(resolution_count / 2, 1.0) * 0.5 * max_score

    # Positive ending sentiment suggests resolution (up to 30%)
    segments = sentiment_data.get("segments", [])
    if segments:
        last_segments = segments[-3:]  # Last 3 segments
        positive_end  = sum(1 for s in last_segments if s.get("label") == "positive")
        if positive_end >= 2:
            score += 0.3 * max_score
        elif positive_end == 1:
            score += 0.15 * max_score

    # Overall positive sentiment bonus (up to 20%)
    if sentiment_data.get("label") == "positive":
        score += 0.2 * max_score

    return round(min(score, max_score), 2)


def _score_langage(agent_text: str, max_score: float) -> float:
    """
    Scores the agent's language quality.
    Penalizes unprofessional, rude, or negative language.
    """
    if not agent_text:
        return max_score * 0.5  # Neutral default

    text = agent_text.lower()

    # Start with full score and deduct for negative language
    score = max_score

    # Deduct for each negative language indicator found
    penalties = sum(1 for kw in NEGATIVE_LANGUAGE if kw in text)
    score    -= penalties * (max_score * 0.25)  # 25% deduction per violation

    # Deduct for very short responses (might indicate dismissiveness)
    avg_length = len(text) / max(len(text.split(".")), 1)
    if avg_length < 10:
        score -= max_score * 0.1

    return round(max(score, 0.0), 2)


def _score_conformite(agent_text: str, max_score: float) -> float:
    """
    Scores script/compliance adherence.
    Checks if required compliance phrases were used.
    """
    if not agent_text:
        return 0.0

    text  = agent_text.lower()
    score = 0.0

    # Score based on compliance phrases used
    compliant_count = sum(1 for kw in COMPLIANCE_REQUIRED if kw in text)
    score = min(compliant_count / len(COMPLIANCE_REQUIRED), 1.0) * max_score

    return round(score, 2)


def _score_cloture(closing_text: str, max_score: float) -> float:
    """
    Scores the call closing.
    Checks if the agent used proper farewell phrases in the last 30s.
    """
    if not closing_text:
        return 0.0

    text  = closing_text.lower()
    score = 0.0

    # Proper farewell
    if any(kw in text for kw in CLOSING_KEYWORDS):
        score += 0.7 * max_score

    # Offered further help
    if any(kw in text for kw in ["autre chose", "anything else", "further assistance"]):
        score += 0.3 * max_score

    return round(min(score, max_score), 2)


# ── Text extraction helpers ───────────────────────────────────────────────────

def _get_opening_text(segments: List[Dict], seconds: float = 30.0) -> str:
    """Returns concatenated text from the first N seconds of the call."""
    return " ".join(
        s.get("text", "")
        for s in segments
        if s.get("start", 0) <= seconds
    )


def _get_closing_text(segments: List[Dict], seconds: float = 30.0) -> str:
    """Returns concatenated text from the last N seconds of the call."""
    if not segments:
        return ""
    end_time = segments[-1].get("end", 0)
    return " ".join(
        s.get("text", "")
        for s in segments
        if s.get("end", 0) >= end_time - seconds
    )


def _get_agent_text(segments: List[Dict]) -> str:
    """
    Returns only agent speech segments.
    Assumes SPEAKER_00 is the agent (first speaker detected by diarization).
    Falls back to all text if no speaker labels are available.
    """
    agent_segments = [
        s for s in segments
        if s.get("speaker") in ("SPEAKER_00", "UNKNOWN", None)
    ]

    if not agent_segments:
        return " ".join(s.get("text", "") for s in segments)

    return " ".join(s.get("text", "") for s in agent_segments)