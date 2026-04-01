"""
NLLB-200 Hindi translator.
Uses facebook/nllb-200-distilled-600M for English → Hindi translation.
Model is loaded once at startup and cached.
"""
import logging
import threading

logger = logging.getLogger(__name__)

_model = None
_tokenizer = None
_lock = threading.Lock()
_load_error = None


def _load_model():
    """Load NLLB-200 model (called once at startup)."""
    global _model, _tokenizer, _load_error
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        model_name = "facebook/nllb-200-distilled-600M"
        logger.info(f"Loading {model_name} — this may take a few minutes on first run...")
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
        logger.info("NLLB-200 model loaded successfully.")
    except Exception as e:
        _load_error = str(e)
        logger.error(f"Failed to load NLLB-200 model: {e}")


def initialize():
    """Call this at FastAPI startup to pre-load the model."""
    with _lock:
        if _model is None and _load_error is None:
            _load_model()


def translate_to_hindi(text: str) -> str:
    """
    Translate English text to Hindi using NLLB-200.
    Returns Hindi string, or falls back to English if model unavailable.
    """
    if _load_error:
        return f"[Hindi translation unavailable: {_load_error}]"

    if _model is None or _tokenizer is None:
        return "[Hindi translation not loaded yet]"

    try:
        # NLLB language codes: eng_Latn → hin_Deva
        inputs = _tokenizer(
            text,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )
        target_lang_id = _tokenizer.convert_tokens_to_ids("hin_Deva")
        translated_tokens = _model.generate(
            **inputs,
            forced_bos_token_id=target_lang_id,
            max_length=512,
            num_beams=4,
        )
        hindi_text = _tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)[0]
        return hindi_text
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text  # Return original English as fallback


def translate_findings(findings: list[dict]) -> list[dict]:
    """
    Add Hindi translations to all findings that have english_explanation.
    """
    for finding in findings:
        eng = finding.get("english_explanation", "")
        if eng:
            finding["hindi_explanation"] = translate_to_hindi(eng)
    return findings
