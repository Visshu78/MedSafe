import json
import os
from rapidfuzz import process, fuzz

# Load brand → generic map once
_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(_DATA_DIR, "brand_generic_map.json"), encoding="utf-8") as f:
    BRAND_MAP: dict = json.load(f)

BRAND_KEYS = list(BRAND_MAP.keys())


def normalize_medicine(name: str) -> dict:
    """
    Resolve a brand/generic name to its canonical generic name.
    Returns dict with { input, generic, dose_hint, matched_brand, confidence }
    """
    name_lower = name.strip().lower()

    # Direct lookup
    if name_lower in BRAND_MAP:
        entry = BRAND_MAP[name_lower]
        return {
            "input": name,
            "generic": entry["generic"],
            "dose_hint": entry.get("dose_hint", ""),
            "matched_brand": name_lower,
            "confidence": 100,
        }

    # Fuzzy match (handles typos, partial names)
    result = process.extractOne(name_lower, BRAND_KEYS, scorer=fuzz.token_set_ratio)
    if result and result[1] >= 70:
        matched_key = result[0]
        entry = BRAND_MAP[matched_key]
        return {
            "input": name,
            "generic": entry["generic"],
            "dose_hint": entry.get("dose_hint", ""),
            "matched_brand": matched_key,
            "confidence": result[1],
        }

    # Not found — treat the input itself as a generic name (capitalize)
    return {
        "input": name,
        "generic": name.strip().title(),
        "dose_hint": "",
        "matched_brand": None,
        "confidence": 0,
    }


def normalize_medicines(names: list[str]) -> list[dict]:
    """Normalize a list of medicine names."""
    return [normalize_medicine(n) for n in names if n.strip()]
