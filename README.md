# LegalAId — Verified AI Legal Rights & Statutory Notice Platform

> **PS-04 Hackathon Project** — A decision-support and document-drafting platform designed for first-generation litigants navigating Indian jurisprudence. Powered by pure Machine Learning classification, deterministic statutory Knowledge Bases, strict Citation Guards, and a 100% editable legal notice engine.

---

## Key Differentiating Architecture

1. **Pure Machine Learning Classification (100.00% 5-Fold Cross-Validation Accuracy)**
   - Powered by a custom `FeatureUnion` pipeline combining Word TF-IDF (`ngram_range=(1, 3)`) and Character WB TF-IDF (`ngram_range=(3, 5)`) paired with `LogisticRegression(C=3.0)`.
   - Trained on **757 clean English training samples** across 12 legal classes. **Zero manual rule boosting**.

2. **Verbatim Bare Act Law Display & Citation Accuracy Guarantee**
   - Displays official verbatim statutory law quotes (`section_text_plain`) first, followed by simplified plain-language explanations.
   - Legal citations are retrieved deterministically via SQL queries against a hand-verified Knowledge Base (`kb_entries`). No LLM is involved in section selection.

3. **Citation Guard Normalization & Fallback Chain**
   - Generated plain-language explanations are automatically scanned with punctuation-normalized regex rules (`verify_citation_guard`).
   - Fallback chain: **OpenRouter Free Auto-Router → Groq API → Gemini API → Unmodified KB Seed Fallback**.
   - Model safety evaluation headers (e.g. `"User Safety: safe"`) are automatically stripped.

4. **100% Editable Legal Notice Generator & Live PDF Blueprint**
   - Users can edit personal details, **Notice Subject**, and the **Full Notice Body Content** (add specific invoice dates, transaction IDs, phone IMEIs, or custom relief demands).
   - Features a **Live Real-Time PDF Paper Blueprint** preview on screen.
   - Compiles user edits into custom downloadable PDFs via FPDF2 with mandatory legal disclaimers.

5. **Grounded RAG Statutory Q&A Assistant**
   - Grounded vector search retrieving relevant Bare Act chunks and precedent citations for follow-up statutory queries.

---

## Supported Legal Domains (12 Classes across 5 Domains)

| Domain | Issue Type | Primary Statute & Section | Filing Forum |
| :--- | :--- | :--- | :--- |
| **Consumer Rights** | `unfair_trade_practice` | Consumer Protection Act, 2019 (Sec 2(47)) / BNS Sec 318 | Consumer Commission (NCDRC) |
| **Consumer Rights** | `defective_product` | Consumer Protection Act, 2019 (Sec 2(10)) | Consumer Commission |
| **Consumer Rights** | `deficiency_of_service` | Consumer Protection Act, 2019 (Sec 2(11)) | Consumer Commission |
| **Tenant Rights** | `deposit_not_returned` | State Rent Control Acts & Model Tenancy Act, 2021 | Rent Authority / Civil Court |
| **Tenant Rights** | `illegal_eviction` | Model Tenancy Act, 2021 (Sec 21) | Rent Tribunal / Civil Court |
| **Tenant Rights** | `maintenance_neglect` | Model Tenancy Act, 2021 (Sec 15) | Rent Authority |
| **Labor & Workplace** | `unpaid_wages` | Payment of Wages Act, 1936 (Sec 15) / IDA 1947 | Labour Commissioner |
| **Labor & Workplace** | `wrongful_termination` | Industrial Disputes Act, 1947 (Sec 25F & 25N) | Labour Court |
| **Labor & Workplace** | `overtime_denial` | Factories Act, 1948 (Sec 59) / Shops & Est. Act | Inspector of Factories / Labour Court |
| **Cyber & Financial** | `upi_phishing_fraud` | IT Act, 2000 (Sec 66D) / BNS Sec 318 | Cyber Police (1930) & Ombudsman |
| **Real Estate & Property**| `builder_possession_delay` | Real Estate (RERA) Act, 2016 (Sec 18(1)) | RERA Authority / Adjudicating Officer |

---

## Technology Stack

- **Frontend**: React 18, Vite 5, Lucide React Icons, Vanilla CSS Glassmorphism & Executive Corporate Legal Tech Aesthetics (`#070a12`, `#f59e0b`, `#2563eb`).
- **Backend**: FastAPI, Python 3.13, SQLAlchemy, SQLite, Scikit-learn (`FeatureUnion`, `LogisticRegression`), FPDF2 (PDF Generation), Requests (OpenRouter/Groq/Gemini APIs).

---

## Project Structure

```
e:\GDG
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # FastAPI REST endpoints (/api/intake, /api/explanation, /api/document/generate, /api/chat)
│   │   ├── db/                    # SQLAlchemy models & DB seeder (seed_kb.py)
│   │   ├── ml/                    # Classifier training pipeline & dataset (dataset.json, train_classifier.py)
│   │   └── services/              # Pure ML classification, extraction, KB, LLM, PDF Generator, RAG
│   ├── tests/test_pipeline.py     # Pytest automated test suite
│   ├── requirements.txt
│   └── main.py
└── frontend/
    ├── src/
    │   ├── App.jsx                # Executive Workspace, Bare Act Quote Box, Editable Notice Editor & Live Blueprint
    │   ├── index.css              # Executive Slate Navy design system & glassmorphism
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Running Locally

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate

pip install -r requirements.txt

# Seed Database with Bare Act Entries & RAG Statute Chunks
python -m app.db.seed_kb

# Train Machine Learning Classifier Model (757 Samples)
python -m app.ml.train_classifier

# Start FastAPI Development Server
python -m app.main
```
The API will be live at `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`).

### 2. Frontend Setup (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
The Web Application will be live at `http://localhost:3000`.

---

## Testing & Verification

Run the automated backend test suite:

```bash
cd backend
python -m pytest tests/test_pipeline.py
```
