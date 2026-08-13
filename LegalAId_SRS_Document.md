# LegalAId — Software Requirements Specification (SRS)
**PS-04: AI Legal Rights Assistant for First-Generation Litigants**
Version 1.0 | Structured per IEEE 830 conventions

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and interface requirements for LegalAId, a web application that classifies a user's plain-language legal problem, retrieves the applicable Indian legal sections from a curated knowledge base, generates a plain-language explanation, and produces a downloadable legal notice/complaint document. It is written for the development team, faculty mentor, and hackathon judges to establish a single, unambiguous source of truth for what the system must do.

### 1.2 Scope
LegalAId covers three legal domains at MVP: **consumer rights**, **labor disputes**, and **tenant/rental disputes**. It is a decision-support and document-drafting tool — it does not represent a licensed advocate, does not file documents with any court/commission on the user's behalf, and does not guarantee legal outcomes. See Features Document §5 for explicit out-of-scope items.

### 1.3 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|---|---|
| KB | Knowledge Base (`kb_entries` table — the deterministic legal-fact source) |
| IPC | Indian Penal Code (pre-2024) |
| BNS | Bharatiya Nyaya Sanhita, 2023 (replaces IPC) |
| NLP | Natural Language Processing |
| NER | Named Entity Recognition |
| PII | Personally Identifiable Information |
| RLS | Row-Level Security (PostgreSQL feature) |
| p95 | 95th percentile (latency metric) |
| DPDP Act | Digital Personal Data Protection Act, 2023 (India) |

### 1.4 References
- Technical Specification document (LegalAId_Technical_Specification.md)
- Features Document (LegalAId_Features_Document.md)
- Consumer Protection Act, 2019
- Model Tenancy Act, 2021
- Indian Penal Code, 1860 / Bharatiya Nyaya Sanhita, 2023
- Digital Personal Data Protection Act, 2023

### 1.5 Overview
Section 2 describes the product at a high level. Section 3 lists specific, testable requirements. Section 4 covers data requirements. Section 5 covers external interfaces.

---

## 2. Overall Description

### 2.1 Product Perspective
LegalAId is a standalone web application (not integrated into any existing government or court system). It is a new, self-contained product with three tiers: React frontend, FastAPI backend, PostgreSQL database, plus two external API dependencies (Groq/Gemini for language generation only — never for legal fact retrieval).

### 2.2 Product Functions (summary — full detail in Features Document)
1. Accept free-text legal problem description (Hindi/English)
2. Classify domain and issue type
3. Extract structured entities from the description
4. Retrieve applicable legal sections deterministically
5. Generate a plain-language rights explanation
6. Present structured results (explanation + law + forum + limitation period)
7. Generate an editable, downloadable PDF legal notice

### 2.3 User Classes and Characteristics

| User class | Characteristics | Primary needs |
|---|---|---|
| First-generation litigant (primary) | Low/no legal literacy, may be more comfortable in Hindi, likely using a mobile device | Simple language, minimal typing, clear next steps |
| Hackathon judge / evaluator | Technical + legal literacy, will stress-test edge cases | Citation accuracy, transparency, "not a wrapper" evidence |
| Admin/team member (internal) | Technical | KB maintenance, monitoring |

### 2.4 Operating Environment
- Frontend: modern browsers (Chrome, Firefox, Edge, Safari — last 2 major versions), responsive down to 360px width (mobile-first, per primary user class)
- Backend: Python 3.11+, FastAPI, deployed on Render (or equivalent free-tier PaaS)
- Database: PostgreSQL 15+ (Render Postgres or Supabase)

### 2.5 Design and Implementation Constraints
- Must run entirely on free-tier infrastructure (hackathon constraint)
- LLM calls restricted to Stage 4 only — **hard constraint, not a preference** (see FR-09, FR-10)
- Must support both English and Hindi input (problem statement requirement)
- Must produce a PDF output (problem statement requirement)

### 2.6 Assumptions and Dependencies
- Groq/Gemini API availability (fallback chain assumed sufficient; no SLA guaranteed on free tier — see Risks in NFR doc)
- Users have basic smartphone/browser literacy even if not legal literacy
- KB content is manually curated and verified by the team, not scraped/generated at runtime

---

## 3. Specific Requirements

Functional requirements use the pattern **FR-XX: [requirement]. Rationale: [why]. Verification: [how tested].** This format is deliberate — every requirement must be testable, not just descriptive.

### 3.1 Intake & Classification

**FR-01:** The system shall accept free-text input up to 2000 characters in English or Hindi (Devanagari script).
*Verification:* Submit both scripts, confirm both are stored and processed without corruption.

**FR-02:** The system shall auto-detect input language and allow manual override.
*Verification:* Submit ambiguous/mixed text, confirm override control changes downstream processing.

**FR-03:** The system shall classify input into one of the defined `domain` values (`consumer`, `labor`, `tenant`) and a specific `issue_type`, with a numeric confidence score between 0 and 1.
*Verification:* Run against a held-out test set of exemplar phrases per issue type; log accuracy.

**FR-04:** If classification confidence is below the configured threshold (default 0.55), the system shall generate a clarifying question rather than proceeding.
*Verification:* Submit deliberately ambiguous input, confirm clarifying question is shown, not a wrong classification.

**FR-05:** After 2 failed clarification rounds, the system shall present a manual domain-selection control.
*Verification:* Force 2 low-confidence rounds, confirm manual picker appears and is functional.

**FR-06:** The system shall extract structured entities (dates, monetary amounts in ₹/Rs, party names, addresses) from the input text.
*Verification:* Submit text with known entities, confirm all are extracted and correctly typed.

**FR-07:** The system shall present all extracted entities to the user for review and correction before they are used in document generation.
*Verification:* Confirm no entity reaches Stage 6 with `confirmed_by_user = false`.

### 3.2 Legal Knowledge Retrieval

**FR-08:** The system shall retrieve applicable legal sections exclusively via a deterministic database query against the `kb_entries` table, keyed by `domain` and `issue_type`.
*Rationale:* This is the core accuracy guarantee and the core "not a GPT wrapper" differentiator.
*Verification:* Code review confirms no LLM call exists in the retrieval code path; identical domain/issue_type inputs always return identical section citations.

**FR-09:** Every `kb_entries` row shall be tagged with an explicit `law_code` value (`IPC`, `BNS`, or `N/A`).
*Verification:* Query confirms no NULL `law_code` values in production KB.

**FR-10:** Where an IPC section's BNS equivalent is not a clean 1:1 mapping, the system shall display this explicitly rather than asserting a false equivalence.
*Verification:* Manual review of KB entries against India Code source for at least 10 sampled sections.

### 3.3 Explanation Generation

**FR-11:** The system shall generate a plain-language rights explanation using an LLM, with the LLM's input strictly limited to the KB's `plain_summary_seed` plus user-provided facts — the LLM shall never be the source of any section number, act name, or forum.
*Verification:* Prompt-injection test — attempt to get the LLM to cite an unrelated section; confirm guard (FR-12) catches it.

**FR-12:** The system shall automatically scan every LLM-generated explanation for citation-like patterns (`Section \d+`, `Article \d+`, `Act,? \d{4}`) not present in the injected KB text, and shall discard/retry any output that fails this check, falling back to the unmodified KB text after one retry.
*Verification:* Unit test with a mocked LLM response containing a fabricated citation; confirm it is rejected.

### 3.4 Results Presentation

**FR-13:** The system shall present results as three distinct sections: rights explanation, applicable law (with forum and limitation period), and a document-generation call to action.
*Verification:* UI test confirms all three sections render given a completed classification.

**FR-14:** The system shall display the limitation period associated with the identified issue type, and shall compute a countdown warning only when the user has provided a relevant date — never an assumed or inferred date.
*Verification:* Test with and without a date entity present; confirm no fabricated countdown appears in the no-date case.

### 3.5 Document Generation

**FR-15:** The system shall allow the user to select between at least two document tones ("request" and "formal notice") prior to generation.

**FR-16:** The system shall generate a PDF document containing user details, opposing party details, stated facts, cited legal sections (verbatim from the KB, not regenerated), relief sought, and date.

**FR-17:** The system shall include the fixed, non-LLM-generated disclaimer text on every page of the generated PDF and on the relevant UI screens.

**FR-18:** The system shall allow the user to edit previously submitted entities and regenerate the document without repeating classification or extraction.

**FR-19:** The system shall provide the completed document via a time-limited, non-public download link.

### 3.6 Session & Data Handling

**FR-20:** The system shall allow use without requiring account creation (anonymous session mode), while supporting optional persistent accounts for session history.

**FR-21:** The system shall retain a session's raw intake text, extracted entities, and generated documents only as long as required for the session's active use, per the data retention policy defined in the Security Document.

---

## 4. Data Requirements

Full schema is defined in the Technical Specification document §4. Summary of core entities and their relationships:

```
sessions (1) ──< intakes (1) ──< classifications
                              └─< entities
kb_entries (1) ──< documents >── sessions (1)
```

- `sessions`: one per user conversation, optionally linked to a user account
- `intakes`: raw text + language, one per user submission
- `classifications`: domain/issue_type/confidence per intake
- `entities`: extracted structured facts per intake
- `kb_entries`: the curated, versioned legal knowledge base — the single source of truth for citations
- `documents`: generated PDFs with filled data, linked to the KB entry used

---

## 5. External Interface Requirements

### 5.1 User Interfaces
- Chat-style intake screen (mobile-first, minimum 16px text, WCAG AA contrast)
- Three-card results screen
- Entity review/edit form
- Document tone picker + preview + download screen

### 5.2 API Interfaces (summary — full endpoint list in Technical Specification §5)
All endpoints under `/api/`, JSON request/response, documented via FastAPI's auto-generated OpenAPI schema at `/docs`.

### 5.3 External Service Interfaces
| Service | Purpose | Fallback |
|---|---|---|
| Groq API | Primary LLM for Stage 4 explanation generation | Gemini API |
| Gemini API | Fallback LLM | Static KB plain-text (no LLM) |

### 5.4 Hardware Interfaces
None — purely software, browser-based.

---

## 6. Requirements Traceability Note

Every FR-XX in this document should map to at least one FEAT-XX in the Features Document and at least one test case in your team's test plan before submission. Judges scoring "coverage breadth" and "legal accuracy" will often probe exactly the FR-08 through FR-12 chain — know that path cold for your demo.
