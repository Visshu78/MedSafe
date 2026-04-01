"""
MedSafe India — FastAPI Backend
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio
import logging

from engine.normalizer import normalize_medicines
from engine.ddi_checker import check_ddi
from engine.disease_checker import check_drug_disease
from engine.duplicate_checker import check_duplicates
from engine.dosage_checker import check_dosage
from engine.food_checker import check_food
from llm.explainer import explain_all
from llm.translator import initialize as init_translator, translate_findings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load NLLB-200 model at startup in background thread
    logger.info("Starting NLLB-200 model initialization...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, init_translator)
    yield
    logger.info("Shutting down MedSafe India API")


app = FastAPI(
    title="MedSafe India API",
    description="Polypharmacy safety checker for Indian patients",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatientProfile(BaseModel):
    age: int = 45
    weight: float = 70.0
    conditions: list[str] = []
    allergies: list[str] = []


class CheckRequest(BaseModel):
    medicines: list[str]
    patient: PatientProfile


class CheckResponse(BaseModel):
    normalized: list[dict]
    findings: list[dict]
    summary: dict


@app.get("/health")
async def health():
    return {"status": "ok", "service": "MedSafe India"}


@app.post("/api/check", response_model=CheckResponse)
async def check_medicines(request: CheckRequest):
    if not request.medicines:
        raise HTTPException(status_code=400, detail="No medicines provided")

    if len(request.medicines) > 30:
        raise HTTPException(status_code=400, detail="Too many medicines (max 30)")

    # Layer 2: Normalize brand → generic
    normalized = normalize_medicines(request.medicines)
    generics = [m["generic"] for m in normalized]

    # Layer 3: Run all 5 checks in parallel
    ddi_findings = check_ddi(generics)
    disease_findings = check_drug_disease(generics, request.patient.conditions)
    duplicate_findings = check_duplicates(generics)
    dosage_findings = check_dosage(normalized, request.patient.age)
    food_findings = check_food(generics)

    all_findings = ddi_findings + disease_findings + duplicate_findings + dosage_findings + food_findings

    # Layer 4a: LLM English explanation (async)
    all_findings = await explain_all(all_findings)

    # Layer 4b: NLLB-200 Hindi translation (sync, runs in thread pool)
    loop = asyncio.get_event_loop()
    all_findings = await loop.run_in_executor(None, translate_findings, all_findings)

    # Sort by severity: critical > moderate > low
    severity_order = {"critical": 0, "moderate": 1, "low": 2}
    all_findings.sort(key=lambda f: severity_order.get(f.get("severity", "low"), 2))

    # Summary counts
    summary = {
        "total": len(all_findings),
        "critical": sum(1 for f in all_findings if f.get("severity") == "critical"),
        "moderate": sum(1 for f in all_findings if f.get("severity") == "moderate"),
        "low": sum(1 for f in all_findings if f.get("severity") == "low"),
        "ddi": len(ddi_findings),
        "drug_disease": len(disease_findings),
        "duplicates": len(duplicate_findings),
        "dosage": len(dosage_findings),
        "food": len(food_findings),
        "medicines_checked": len(generics),
    }

    return CheckResponse(
        normalized=normalized,
        findings=all_findings,
        summary=summary,
    )


@app.get("/api/medicines/search")
async def search_medicines(q: str = ""):
    """Autocomplete endpoint for medicine search."""
    from engine.normalizer import BRAND_MAP
    if len(q) < 2:
        return []
    q_lower = q.lower()
    results = [
        {"brand": k, "generic": v["generic"], "dose": v.get("dose_hint", "")}
        for k, v in BRAND_MAP.items()
        if q_lower in k.lower() or q_lower in v["generic"].lower()
    ]
    return results[:20]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
