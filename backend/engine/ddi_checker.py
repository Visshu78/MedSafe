import json
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "interactions_db.json"), encoding="utf-8") as f:
    DDI_DB: list = json.load(f)


def check_ddi(generics: list[str]) -> list[dict]:
    """
    Run n² pair comparison against the DDI database.
    Returns list of interaction findings.
    """
    findings = []
    n = len(generics)

    for i in range(n):
        for j in range(i + 1, n):
            drug_a = generics[i]
            drug_b = generics[j]
            match = _find_interaction(drug_a, drug_b)
            if match:
                findings.append({
                    "type": "ddi",
                    "drugs": [drug_a, drug_b],
                    "severity": match["severity"],
                    "mechanism": match["mechanism"],
                    "effect": match["effect"],
                    "action": match["action"],
                    "english_explanation": (
                        f"{drug_a} and {drug_b} interact: {match['effect']}. "
                        f"{match['action']}"
                    ),
                    "hindi_explanation": None,  # filled by LLM/translator
                })

    return findings


def _find_interaction(drug_a: str, drug_b: str) -> dict | None:
    """Case-insensitive lookup in DDI db for a drug pair."""
    a_lower = drug_a.lower()
    b_lower = drug_b.lower()

    for entry in DDI_DB:
        ea = entry["drug_a"].lower()
        eb = entry["drug_b"].lower()

        # Match by checking if drug name is a substring of the db entry or vice versa
        if (_partial_match(a_lower, ea) and _partial_match(b_lower, eb)) or \
           (_partial_match(a_lower, eb) and _partial_match(b_lower, ea)):
            return entry

    return None


def _partial_match(query: str, target: str) -> bool:
    """Check if query and target share a meaningful token (handles 'Aspirin 75mg' vs 'Aspirin')."""
    q_tokens = set(query.split())
    t_tokens = set(target.split())
    return bool(q_tokens & t_tokens) or query in target or target in query
