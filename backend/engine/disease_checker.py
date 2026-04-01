import json
import os

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "drug_disease_db.json"), encoding="utf-8") as f:
    DISEASE_DB: dict = json.load(f)


def check_drug_disease(generics: list[str], conditions: list[str]) -> list[dict]:
    """
    Check each medicine against the patient's condition list.
    Returns list of drug-disease conflict findings.
    """
    findings = []

    for condition in conditions:
        # Try exact match, then case-insensitive
        condition_entries = None
        for db_condition in DISEASE_DB:
            if db_condition.lower() == condition.lower():
                condition_entries = DISEASE_DB[db_condition]
                break

        if not condition_entries:
            continue

        for entry in condition_entries:
            contraindicated_drug = entry["drug"].lower()
            for generic in generics:
                generic_lower = generic.lower()
                # Partial match: "Ibuprofen 400mg" matches "Ibuprofen"
                if contraindicated_drug in generic_lower or generic_lower in contraindicated_drug:
                    findings.append({
                        "type": "drug_disease",
                        "drug": generic,
                        "condition": condition,
                        "severity": entry["severity"],
                        "reason": entry["reason"],
                        "action": entry["action"],
                        "english_explanation": (
                            f"{generic} is contraindicated in {condition}: {entry['reason']}. "
                            f"{entry['action']}"
                        ),
                        "hindi_explanation": None,
                    })

    return findings
