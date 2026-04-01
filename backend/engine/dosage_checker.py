import json
import os
import re

_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "dosage_thresholds.json"), encoding="utf-8") as f:
    DOSAGE_DB: dict = json.load(f)


def _extract_dose_mg(name: str) -> float | None:
    """Extract numeric dose from medicine name like 'Atorvastatin 40mg' or 'Metformin 1000'."""
    match = re.search(r"(\d+(?:\.\d+)?)\s*(?:mg|mcg|g|µg)?", name, re.IGNORECASE)
    if match:
        val = float(match.group(1))
        unit = match.group(0).lower()
        # Convert mcg to mg for comparison
        if "mcg" in unit or "µg" in unit:
            val /= 1000
        elif "g" in unit and "mg" not in unit:
            val *= 1000
        return val
    return None


def check_dosage(normalized_meds: list[dict], age: int) -> list[dict]:
    """
    Compare prescribed doses against age-adjusted thresholds.
    normalized_meds: list of { input, generic, dose_hint, ... }
    """
    findings = []
    is_elderly = age >= 65

    for med in normalized_meds:
        generic_name = med.get("generic", "")
        input_name = med.get("input", "")

        # Try to find dose threshold entry
        threshold_entry = None
        for drug_name, threshold in DOSAGE_DB.items():
            if drug_name.lower() in generic_name.lower() or generic_name.lower() in drug_name.lower():
                threshold_entry = threshold
                break

        if not threshold_entry:
            continue

        # Extract dose from input name (e.g. "Glycomet 1000")
        prescribed_dose = _extract_dose_mg(input_name) or _extract_dose_mg(generic_name)

        if prescribed_dose is None:
            continue

        if is_elderly and age >= threshold_entry.get("elderly_cutoff_age", 65):
            max_dose = threshold_entry["elderly_max_mg"]
            if prescribed_dose > max_dose:
                findings.append({
                    "type": "dosage",
                    "drug": generic_name,
                    "prescribed_mg": prescribed_dose,
                    "recommended_max_mg": max_dose,
                    "age": age,
                    "severity": "moderate",
                    "note": threshold_entry.get("note", ""),
                    "english_explanation": (
                        f"{generic_name}: Prescribed dose ({prescribed_dose}mg) exceeds the "
                        f"recommended elderly maximum ({max_dose}mg for age ≥{threshold_entry['elderly_cutoff_age']}). "
                        f"{threshold_entry.get('note', '')}"
                    ),
                    "hindi_explanation": None,
                    "action": f"Discuss dose reduction with your doctor. Elderly patients need lower doses due to slower metabolism.",
                })
        else:
            max_dose = threshold_entry["adult_max_mg"]
            if prescribed_dose > max_dose:
                findings.append({
                    "type": "dosage",
                    "drug": generic_name,
                    "prescribed_mg": prescribed_dose,
                    "recommended_max_mg": max_dose,
                    "age": age,
                    "severity": "moderate",
                    "note": threshold_entry.get("note", ""),
                    "english_explanation": (
                        f"{generic_name}: Prescribed dose ({prescribed_dose}mg) exceeds the "
                        f"standard maximum ({max_dose}mg). "
                        f"{threshold_entry.get('note', '')}"
                    ),
                    "hindi_explanation": None,
                    "action": "Verify this dose with your prescribing doctor.",
                })

    return findings
