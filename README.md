# LegalAId — AI Legal Rights Assistant for First-Generation Litigants
**PS-04 Hackathon Project**

LegalAId is a decision-support and document-drafting web application designed for first-generation litigants in India facing disputes in **Consumer Rights**, **Labor Disputes**, and **Tenant Rights**.

---

## Key Differentiating Architecture

1. **100% Citation Accuracy Guarantee**: Legal citations are retrieved via deterministic SQL queries against a hand-verified Knowledge Base (`kb_entries`). No LLM is involved in section selection.
2. **Citation Hallucination Guard**: Generated plain-language explanations are automatically scanned with regex rules (`verify_citation_guard`). Any output containing unverified legal citations is discarded.
3. **RAG-Grounded Fallback & Chat**: For queries outside the curated KB or follow-up questions, RAG retrieves relevant bare-act statute chunks and validates output grounding with `verify_grounding`. Answers carry a distinct visual badge (*"AI-retrieved reference"* vs *"Verified citation"*).
4. **Mandatory Non-AI Disclaimer**: Printed on every page footer of generated PDF legal notices and UI screens.
5. **Bilingual Devanagari Hindi & English Support**.

---

## Project Structure

```
e:\GDG
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # FastAPI endpoints (/api/intake, /api/explanation, /api/document, /api/chat)
│   │   ├── db/                    # SQLAlchemy models & DB seeding (seed_kb.py)
│   │   └── services/              # Classification, Extraction, KB, LLM, PDF Generator, RAG
│   ├── tests/test_pipeline.py     # Pytest automated test suite
│   ├── requirements.txt
│   └── main.py
└── frontend/
    ├── src/
    │   ├── App.jsx                # Three-card results layout, intake form, PDF tone picker, RAG chat
    │   ├── index.css              # Glassmorphic UI design system & WCAG AA styling
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Running Locally

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

The API will be available at `http://localhost:8000` (OpenAPI docs at `http://localhost:8000/docs`).

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The Web Application will be available at `http://localhost:3000`.

---

## Testing

Run the automated backend test suite:

```bash
cd backend
python -m pytest tests/test_pipeline.py
```
