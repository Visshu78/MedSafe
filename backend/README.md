# MedSafe India — Backend

## Setup

### 1. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate   # Windows
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```
> Note: `torch` install may take a few minutes. NLLB-200 model (~2.4GB) downloads on first run.

### 3. Run the server
```bash
python main.py
```
Server starts at `http://localhost:8000`

### Optional: LM Studio
- Download LM Studio from https://lmstudio.ai
- Load any model (Llama 3 8B recommended)
- Start the local server on port 1234
- The API will use it for enhanced English explanations
- Without LM Studio, template-based explanations are used automatically

## API

### POST /api/check
```json
{
  "medicines": ["Ecosprin 75", "Glycomet 500", "Telma 40"],
  "patient": {
    "age": 72,
    "weight": 65,
    "conditions": ["Diabetes", "Hypertension"],
    "allergies": []
  }
}
```

### GET /api/medicines/search?q=metf
Returns autocomplete results for medicine search.
