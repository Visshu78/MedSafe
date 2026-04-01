import json
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "food_interactions.json"), encoding="utf-8") as f:
    FOOD_DB: list = json.load(f)


def check_food(generics: list[str]) -> list[dict]:
    """
    Check each generic medicine against the food interaction database.
    """
    findings = []

    for generic in generics:
        g_lower = generic.lower()
        for entry in FOOD_DB:
            db_drug = entry["drug"].lower()
            if db_drug in g_lower or g_lower in db_drug or _token_match(g_lower, db_drug):
                findings.append({
                    "type": "food",
                    "drug": generic,
                    "food": entry["food"],
                    "hindi_food": entry.get("hindi_food", ""),
                    "severity": entry["severity"],
                    "mechanism": entry["mechanism"],
                    "effect": entry["effect"],
                    "action": entry["action"],
                    "english_explanation": (
                        f"{generic} interacts with {entry['food']}: {entry['effect']}. "
                        f"{entry['action']}"
                    ),
                    "hindi_explanation": None,
                })

    return findings


def _token_match(query: str, target: str) -> bool:
    q_tokens = set(query.split())
    t_tokens = set(target.split())
    return bool(q_tokens & t_tokens)
