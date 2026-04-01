"""
LM Studio explainer — generates English plain-language explanations.
Falls back to rule-based templates if LM Studio is offline.
"""
import httpx
import logging

logger = logging.getLogger(__name__)

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"
LM_STUDIO_TIMEOUT = 15.0  # seconds

SEVERITY_TEMPLATES = {
    "critical": "⚠️ CRITICAL: {effect} Do not continue without doctor approval.",
    "moderate": "Caution: {effect} Discuss with your doctor at the next visit.",
    "low": "Low risk: {effect} No immediate action needed.",
}


def _build_prompt(finding: dict) -> str:
    """Build a concise prompt for a single interaction finding."""
    ftype = finding.get("type", "interaction")
    base = finding.get("english_explanation", "")

    if ftype == "ddi":
        drugs = " and ".join(finding.get("drugs", []))
        return (
            f"You are a medical explainer for Indian family caregivers. "
            f"In 2 simple sentences, explain this drug interaction in plain English "
            f"(avoid jargon, mention the real-world risk clearly, and end with one "
            f"concrete action the family should take): "
            f"Interaction between {drugs}: {base}"
        )
    elif ftype == "drug_disease":
        return (
            f"You are a medical explainer for Indian family caregivers. "
            f"In 2 simple sentences, explain why this medicine is risky for this patient "
            f"(plain English, real risk, one action): "
            f"{base}"
        )
    elif ftype == "food":
        return (
            f"You are a medical explainer for Indian family caregivers. "
            f"In 2 simple sentences, explain this food-drug interaction "
            f"(plain English, real risk, one dietary action): "
            f"{base}"
        )
    else:
        return (
            f"You are a medical explainer for Indian family caregivers. "
            f"In 2 simple sentences, explain this medication concern "
            f"(plain English, one action): {base}"
        )


async def explain_finding(finding: dict) -> str:
    """
    Call LM Studio to get a plain-English explanation.
    Returns explanation string. Falls back to template on error.
    """
    prompt = _build_prompt(finding)
    try:
        async with httpx.AsyncClient(timeout=LM_STUDIO_TIMEOUT) as client:
            response = await client.post(
                LM_STUDIO_URL,
                json={
                    "model": "local-model",  # LM Studio uses whatever is loaded
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 150,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.warning(f"LM Studio unavailable ({e}), using template fallback")
        # Fallback to existing explanation
        return finding.get("english_explanation", "Please consult your doctor.")


async def explain_all(findings: list[dict]) -> list[dict]:
    """
    Enrich all findings with LLM-generated English explanations.
    """
    # Only call LLM for critical/moderate (not for low-risk)
    for finding in findings:
        if finding.get("severity") in ("critical", "moderate"):
            finding["english_explanation"] = await explain_finding(finding)
    return findings
