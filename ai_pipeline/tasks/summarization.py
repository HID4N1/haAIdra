# ai_pipeline/tasks/summarization.py
"""
Summarization task — Step 5 (final step) of the AI pipeline.

Uses an LLM to generate a structured summary of the call including:
  - Motif:           Why did the customer call? (reason for contact)
  - Actions:         What did the agent do? (steps taken)
  - Outcome:         Was the issue resolved? What was the result?
  - Recommendations: What could the agent have done better?

The summary is generated using a structured prompt that includes:
  - The full transcript (or a condensed version for very long calls)
  - The call's score breakdown (to inform recommendations)
  - The detected topics

LLM support:
  - Ollama (local, CPU-friendly) — default for development
  - HuggingFace (cloud/GPU) — for production
"""

import logging
import os
from typing import Dict, List

from utils.db    import save_summary
from models.loaders import get_llm_pipeline

logger = logging.getLogger(__name__)

# Maximum transcript length to include in the prompt
MAX_TRANSCRIPT_CHARS = 3000

# Summary language defaults to French (primary market)
SUMMARY_LANGUAGE = os.environ.get("SUMMARY_LANGUAGE", "french")


def run_summarization(
    call: Dict,
    transcript_data: Dict,
    score_data: Dict,
    topics: List[Dict],
) -> Dict:
    """
    Main summarization entry point called by the pipeline orchestrator.

    Args:
        call:            Dict from db.get_call()
        transcript_data: Dict from run_transcription()
        score_data:      Dict from run_scoring()
        topics:          List from run_topics()

    Returns:
        summary_data dict:
        {
            "motif":           "Customer called about a billing issue...",
            "actions":         "Agent verified account, applied credit...",
            "outcome":         "Issue resolved. Customer satisfied.",
            "recommendations": "Agent could have shown more empathy..."
        }
    """
    call_id  = call["id"]
    segments = transcript_data.get("segments", [])

    logger.info("Starting summarization for call %s", call_id)

    if not segments:
        logger.warning("No segments for summarization: call %s", call_id)
        empty = {
            "motif": "", "actions": "", "outcome": "", "recommendations": ""
        }
        save_summary(call_id, **empty)
        return empty

    # ── Build prompt ──────────────────────────────────────────────────────────
    transcript_text = _build_transcript_text(segments)
    topics_text     = _build_topics_text(topics)
    score_text      = _build_score_text(score_data)

    prompt = _build_prompt(
        transcript_text=transcript_text,
        topics_text=topics_text,
        score_text=score_text,
        language=SUMMARY_LANGUAGE,
    )

    # ── Generate summary ──────────────────────────────────────────────────────
    logger.info("Generating summary with LLM")
    raw_output = _generate(prompt)

    # ── Parse structured output ───────────────────────────────────────────────
    summary_data = _parse_summary(raw_output)

    # ── Save to DB ────────────────────────────────────────────────────────────
    save_summary(
        call_id=call_id,
        motif=summary_data["motif"],
        actions=summary_data["actions"],
        outcome=summary_data["outcome"],
        recommendations=summary_data["recommendations"],
    )

    logger.info("Summarization complete: call=%s", call_id)
    return summary_data


# ── Prompt building ───────────────────────────────────────────────────────────

def _build_transcript_text(segments: List[Dict]) -> str:
    """
    Builds a readable transcript from segments for the prompt.
    Groups consecutive segments by speaker for readability.
    Truncates if too long.
    """
    lines        = []
    last_speaker = None

    for seg in segments:
        speaker = seg.get("speaker", "SPEAKER")
        text    = seg.get("text", "").strip()

        if not text:
            continue

        # Use friendly labels
        label = "Agent" if "00" in str(speaker) else "Customer"

        if speaker != last_speaker:
            lines.append(f"\n{label}: {text}")
            last_speaker = speaker
        else:
            # Continue same speaker
            if lines:
                lines[-1] += f" {text}"
            else:
                lines.append(f"{label}: {text}")

    full_text = "\n".join(lines).strip()

    # Truncate if too long
    if len(full_text) > MAX_TRANSCRIPT_CHARS:
        third     = MAX_TRANSCRIPT_CHARS // 3
        beginning = full_text[:third]
        end       = full_text[-third:]
        full_text = f"{beginning}\n[... transcript truncated ...]\n{end}"

    return full_text


def _build_topics_text(topics: List[Dict]) -> str:
    """Formats detected topics for the prompt."""
    if not topics:
        return "No specific topics detected."
    return ", ".join(
        f"{t['label']} ({round(t['score']*100)}%)"
        for t in topics[:5]
    )


def _build_score_text(score_data: Dict) -> str:
    """Formats score data for the prompt (used for recommendations)."""
    if not score_data:
        return "No score data available."

    lines = [f"Total score: {score_data.get('total', 0):.1f}/100"]
    for criteria in ["accueil", "empathie", "resolution", "langage", "conformite", "cloture"]:
        score = score_data.get(criteria, 0)
        max_  = score_data.get(f"{criteria}_max", 20)
        lines.append(f"  {criteria.capitalize()}: {score:.1f}/{max_:.1f}")

    return "\n".join(lines)


def _build_prompt(
    transcript_text: str,
    topics_text: str,
    score_text: str,
    language: str = "french",
) -> str:
    """
    Builds the structured prompt for the LLM.

    The prompt uses a structured output format so we can reliably
    parse the 4 summary sections from the response.
    """
    return f"""You are an expert call center quality analyst. 
Analyze the following customer service call transcript and provide a structured summary in {language}.

DETECTED TOPICS: {topics_text}

QUALITY SCORES:
{score_text}

TRANSCRIPT:
{transcript_text}

Please provide a structured summary with exactly these 4 sections.
Use the exact labels shown below, followed by a colon and your response.

MOTIF: [Why did the customer call? What was their main issue or request? 1-2 sentences.]

ACTIONS: [What specific actions did the agent take to help the customer? List the key steps. 2-3 sentences.]

OUTCOME: [What was the result of the call? Was the issue resolved? How did the customer feel at the end? 1-2 sentences.]

RECOMMENDATIONS: [Based on the quality scores, what could the agent have done better? Be specific and constructive. 2-3 sentences.]

Respond only with the 4 sections above. Do not add any other text."""


# ── LLM generation ────────────────────────────────────────────────────────────

def _generate(prompt: str) -> str:
    """
    Calls the LLM to generate the summary.
    Returns raw text output.
    """
    try:
        llm    = get_llm_pipeline()
        output = llm(prompt, max_tokens=600)
        logger.debug("LLM output length: %d chars", len(output))
        return output
    except Exception as e:
        logger.error("LLM generation failed: %s", e)
        return ""


# ── Output parsing ────────────────────────────────────────────────────────────

def _parse_summary(raw_output: str) -> Dict:
    """
    Parses the structured LLM output into 4 summary fields.

    Expects output in the format:
        MOTIF: ...
        ACTIONS: ...
        OUTCOME: ...
        RECOMMENDATIONS: ...

    Falls back gracefully if parsing fails.
    """
    import re

    result = {
        "motif":           "",
        "actions":         "",
        "outcome":         "",
        "recommendations": "",
    }

    if not raw_output:
        return result

    # Extract each section using regex
    patterns = {
        "motif":           r"MOTIF\s*:\s*(.*?)(?=ACTIONS\s*:|$)",
        "actions":         r"ACTIONS\s*:\s*(.*?)(?=OUTCOME\s*:|$)",
        "outcome":         r"OUTCOME\s*:\s*(.*?)(?=RECOMMENDATIONS\s*:|$)",
        "recommendations": r"RECOMMENDATIONS\s*:\s*(.*?)(?=$)",
    }

    for field, pattern in patterns.items():
        match = re.search(pattern, raw_output, re.IGNORECASE | re.DOTALL)
        if match:
            text = match.group(1).strip()
            # Clean up any trailing section headers
            text = re.sub(r"\n[A-Z]+\s*:.*$", "", text, flags=re.DOTALL).strip()
            result[field] = text

    # If parsing failed (all fields empty), store raw output in motif
    if not any(result.values()) and raw_output:
        logger.warning("Summary parsing failed — storing raw output in motif")
        result["motif"] = raw_output[:500]  # Limit length

    logger.debug("Parsed summary fields: %s",
                 {k: len(v) for k, v in result.items()})
    return result