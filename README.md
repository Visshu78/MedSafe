# MedSafe India: Polypharmacy Safety Checker

MedSafe India is an AI-powered medication safety checker designed specifically for the Indian context. It addresses the polypharmacy crisis by deeply analyzing prescriptions for elderly patients who visit multiple independent specialists.

Unlike basic lookup tools, MedSafe India understands Indian brand names (like Glycomet and Ecosprin) and performs a **5-dimensional safety check**:

1. **Drug-Drug Interactions (DDI)**: Checks for severe reactions between medications.
2. **Drug-Disease Conflicts**: Flags medications contraindicated by the patient's existing conditions (e.g., NSAIDs and Kidney Disease).
3. **Duplicate Therapy**: Detects redundant medications from the same taxonomical class.
4. **Dosage Anomalies**: Flags inappropriate dosages, with strict threshold adjustments for elderly patients.
5. **Food Interactions**: Warns about dietary conflicts (e.g., Warfarin + Leafy Greens).

To make these clinical warnings accessible to families, the system uses an LLM to generate plain-language explanations and uses an offline, local AI model (`facebook/nllb-200-distilled-600M`) to instantly translate those warnings into Hindi.

---

## Technical Stack

- **Frontend**: React + Vite, styled with a premium Cyberpunk/Glassmorphism theme using Tailwind CSS v4. Includes Web Speech API for voice input.
- **Backend API**: Python + FastAPI.
- **AI / NLP**: RapidFuzz for brand-to-generic normalization, local `transformers` (PyTorch) for the NLLB-200 Hindi translation, and local LM Studio hooks for English plain-text summaries.
- **Database**: Lightweight JSON file databases for extreme portability during hackathons.

---

## How to Run the Project Locally

You will need **Node.js** and **Python** installed on your system. You need to run two separate servers simultaneously: one for the React frontend and one for the FastAPI backend.

### 1. Start the Backend API (Python)

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment (Windows):
```bash
python -m venv venv
venv\Scripts\activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Start the FastAPI server:
```bash
python main.py
```
*Note: The **very first time** you start the backend, it will download the offline Hindi translation model (~2.4 GB). Please be patient. Once downloaded, subsequent startups will be fast.*

The backend will run on `http://localhost:8000`.

### 2. Start the Frontend UI (React)

Open a **new, separate terminal** and navigate to the `frontend` directory:

```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The frontend will start. Open your browser and navigate to:
**http://localhost:5173**

---

## Optional: Enhancing English Explanations with LM Studio

By default, the app uses built-in templates for English explanations to guarantee it works entirely offline without paid API keys. If you want more dynamic, AI-generated explanations:

1. Download and install [LM Studio](https://lmstudio.ai/).
2. Download an LLM (such as Llama-3-8B-Instruct or similar).
3. Start the Local Server in LM Studio (defaulting to port `1234`).
4. MedSafe India's Python backend will automatically detect the local API server at `http://localhost:1234/v1` and use it to dynamically generate plain-language explanations!
