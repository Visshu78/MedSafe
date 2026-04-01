import json
import os
from collections import defaultdict

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "drug_classes.json"), encoding="utf-8") as f:
    DRUG_CLASSES: dict = json.load(f)


def _get_class(generic: str) -> str | None:
    """Find which drug class a generic belongs to."""
    g_lower = generic.lower()
    for drug_class, members in DRUG_CLASSES.items():
        for member in members:
            if member.lower() in g_lower or g_lower in member.lower():
                return drug_class
    return None


def check_duplicates(generics: list[str]) -> list[dict]:
    """
    Group medicines by drug class and flag if more than one from same class.
    """
    class_groups: dict[str, list[str]] = defaultdict(list)

    for generic in generics:
        drug_class = _get_class(generic)
        if drug_class:
            class_groups[drug_class].append(generic)

    findings = []
    for drug_class, members in class_groups.items():
        if len(members) > 1:
            findings.append({
                "type": "duplicate",
                "drug_class": drug_class,
                "drugs": members,
                "severity": "moderate",
                "english_explanation": (
                    f"Duplicate therapy detected: {' and '.join(members)} are both "
                    f"{drug_class}. Using two medicines from the same class rarely "
                    f"provides extra benefit and increases side effect risk."
                ),
                "hindi_explanation": None,
                "action": f"Discuss with your doctor — usually only one {drug_class} is needed.",
            })

    return findings
