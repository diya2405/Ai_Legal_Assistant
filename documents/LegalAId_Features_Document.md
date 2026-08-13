# LegalAId — Features Document
**PS-04: AI Legal Rights Assistant for First-Generation Litigants**
Version 1.0 | Backend: Python (FastAPI) | Database: PostgreSQL

---

## 1. Purpose & Scope

This document enumerates every user-facing and system feature of LegalAId, at the level of detail needed to build, test, and demo each one independently. Every feature is tagged with:
- **ID** — unique, referenced from the SRS and test plans
- **Priority** — MoSCoW (Must / Should / Could / Won't-this-round)
- **Pipeline stage** — maps to the 7-stage architecture in the technical spec
- **Legal citation dependency** — whether this feature touches cited law, and therefore needs the Stage 3/4 accuracy guardrails

Features are grouped by domain area, not by pipeline stage, because that's how judges and users will evaluate the product.

---

## 2. Feature Summary Table

| ID | Feature | Priority | Stage | Cites Law? |
|---|---|---|---|---|
| FEAT-01 | Bilingual free-text intake (Hindi/English) | Must | 1 | No |
| FEAT-02 | Automatic domain + issue-type classification | Must | 2a | No |
| FEAT-03 | Clarifying-question loop on low confidence | Must | 2b | No |
| FEAT-04 | Manual domain override / picker | Must | 2b | No |
| FEAT-05 | Entity extraction (dates, amounts, names, addresses) | Must | 2c | No |
| FEAT-06 | Entity review & correction form | Must | 2c/6 | No |
| FEAT-07 | Deterministic legal section lookup | Must | 3 | **Yes** |
| FEAT-08 | IPC/BNS dual-citation display | Must | 3 | **Yes** |
| FEAT-09 | Plain-language rights explanation | Must | 4 | **Yes (guarded)** |
| FEAT-10 | Hallucination guard on generated explanation | Must | 4 | **Yes** |
| FEAT-11 | Three-card structured results view | Must | 5 | **Yes** |
| FEAT-12 | Limitation-period countdown warning | Must | 5 | **Yes** |
| FEAT-13 | Forum/jurisdiction identification | Must | 5 | **Yes** |
| FEAT-14 | Tone selection (request vs formal notice) | Must | 6 | No |
| FEAT-15 | Editable document draft generation (PDF) | Must | 6 | **Yes** |
| FEAT-16 | Mandatory disclaimer footer on every page/screen | Must | 6/7 | **Yes** |
| FEAT-17 | Document download | Must | 7 | No |
| FEAT-18 | Document regeneration after edits | Should | 7 | **Yes** |
| FEAT-19 | Session history (past cases) | Should | All | No |
| FEAT-20 | Multi-domain coverage: consumer, labor, tenant | Must | 3 | **Yes** |
| FEAT-21 | Source citation transparency panel ("why this law?") | Should | 3/5 | **Yes** |
| FEAT-22 | State-wise issue-frequency stat (crime/complaint context) | Could | 5 | No |
| FEAT-23 | Anonymous session mode (no login required) | Should | 1 | No |
| FEAT-24 | Admin KB editor (add/update legal sections) | Could | 3 | **Yes** |
| FEAT-25 | Accessibility-first UI (large text, simple language toggle) | Should | 5 | No |

---

## 3. Detailed Feature Specifications

### FEAT-01 — Bilingual Free-Text Intake
**User story:** As a first-generation litigant who may be more comfortable in Hindi, I want to describe my problem in my own words in either language, so I don't need to translate legal concepts myself.
**Acceptance criteria:**
- Text input accepts Devanagari and Latin script.
- Language auto-detected (`langdetect` or `fasttext` lang-id) and stored per session; user can override.
- No minimum/maximum enforced beyond a sane cap (~2000 chars) to prevent abuse.
**Notes:** This is the feature most likely to silently fail if the classifier (FEAT-02) isn't multilingual — see Security doc SEC-14 and NFR doc NFR-09.

### FEAT-02 — Domain + Issue-Type Classification
**User story:** As a user, I want the system to figure out what kind of legal issue I have without me needing to know legal terminology.
**Acceptance criteria:**
- Returns `domain` (consumer/labor/tenant) + `issue_type` + `confidence` (0–1) for every intake.
- Model: `paraphrase-multilingual-MiniLM-L12-v2` (sentence-transformers), cosine similarity against curated exemplar set.
- p95 classification latency < 500ms (see NFR-02).

### FEAT-03 — Clarifying-Question Loop
**User story:** As a user whose description was ambiguous, I want the system to ask me a simple follow-up instead of guessing wrong and giving me the wrong law.
**Acceptance criteria:**
- Triggers when confidence < 0.55 (configurable threshold, stored in `config`, not hardcoded).
- Question is templated from the top-2 candidate issue types, not LLM-generated (keeps it deterministic and fast).
- Loop capped at 2 rounds; on 3rd failure, falls back to FEAT-04 (manual picker) — **never leave the user stuck**.

### FEAT-04 — Manual Domain Override
**User story:** As a user (or as a judge testing edge cases live), I want to just pick my domain manually if the AI can't figure it out.
**Acceptance criteria:** Always-visible "Not what I meant? Pick manually" link, available at any point in the classification flow, not just after failures.

### FEAT-05 — Entity Extraction
**User story:** As a user, I don't want to re-type my landlord's name and the deposit amount into a form after I already said it in my description.
**Acceptance criteria:**
- Extracts: dates (ISO-normalized), amounts (₹/Rs, numeric-normalized), party names, addresses.
- spaCy `en_core_web_sm` for English; for Hindi, extraction runs on a machine-translated intermediate (flag translation confidence to user — don't silently trust it).
- Every extracted entity is stored with a `confirmed_by_user = false` flag until FEAT-06.

### FEAT-06 — Entity Review & Correction Form
**User story:** As a user, I want to fix anything the AI got wrong before it goes into my legal document.
**Acceptance criteria:**
- Every extracted entity is editable, none are auto-submitted without user confirmation.
- Empty/missing required fields (e.g. opposing party name) block document generation with a clear inline message, not a silent failure.

### FEAT-07 — Deterministic Legal Section Lookup
**User story:** As a user, I need the law cited to actually be correct, not an AI guess.
**Acceptance criteria:**
- Pure SQL lookup: `SELECT * FROM kb_entries WHERE domain = :d AND issue_type = :i`. **No LLM call in this feature, ever** — this is the accuracy backbone of the whole product and the core "not a GPT wrapper" claim.
- Every `kb_entries` row has a `source_url` and `last_verified_date` column so citations are auditable.

### FEAT-08 — IPC/BNS Dual-Citation Display
**User story:** As a user (or judge), I want to see both the old (IPC) and new (BNS) section numbers where relevant, since both are still in public use.
**Acceptance criteria:**
- `kb_entries.law_code` explicitly tagged `IPC`, `BNS`, or `N/A` (for non-criminal acts like Consumer Protection Act).
- Where an IPC section maps to a *split or restructured* BNS section, UI shows "Nearest BNS equivalent: ..." rather than a false 1:1 claim.
- **This is the single highest legal-accuracy risk item in the whole project — see Technical Spec §7.**

### FEAT-09 — Plain-Language Rights Explanation
**User story:** As a user with no legal background, I want the law explained to me like a knowledgeable friend would, not like a bare statute.
**Acceptance criteria:**
- LLM (Groq primary / Gemini fallback) rephrases `plain_summary_seed` + user's specific facts into 3–4 sentences.
- Prompt explicitly forbids introducing section numbers or new legal claims not present in the injected seed text.

### FEAT-10 — Hallucination Guard
**User story:** (System feature, but directly protects every user) — the AI-generated explanation must never contain a citation that didn't come from the deterministic KB.
**Acceptance criteria:**
- Post-generation regex scan for patterns like `Section \d+`, `Article \d+`, `Act,? \d{4}` in the LLM output.
- Any match not present in the exact set injected from Stage 3 → discard response, retry once with a stricter prompt, then fall back to the KB's unmodified plain text.
- Every discarded/retried generation is logged (see Security doc SEC-11, audit logging) for your own QA and for judges who ask "how do you know this doesn't hallucinate?"

### FEAT-11 — Three-Card Results View
**User story:** As a user, I want my results organized clearly: what does this mean for me, what's the actual law, and what can I do next.
**Acceptance criteria:** Card 1 = rights explanation (FEAT-09). Card 2 = applicable sections + forum + limitation period (FEAT-07, FEAT-08, FEAT-12, FEAT-13). Card 3 = "Generate Document" CTA (FEAT-14/15).

### FEAT-12 — Limitation-Period Countdown Warning
**User story:** As a user, I need to know if I'm about to run out of time to act, because missing this can mean losing my legal remedy entirely.
**Acceptance criteria:**
- `kb_entries.limitation_period` parsed into a human-readable warning.
- If the user provided a relevant date (e.g. "incident happened on..."), compute days remaining and flag in red if < 30 days remain. If no date given, show the general limitation period as text only — **never fabricate a deadline from an assumed date**.

### FEAT-13 — Forum/Jurisdiction Identification
**User story:** As a user, I want to know exactly where to file my complaint (which commission, which court), not just what the law says.
**Acceptance criteria:** `kb_entries.remedy_forum` displayed with a one-line explanation of what that forum is (e.g. "District Consumer Disputes Redressal Commission — handles consumer complaints up to ₹1 crore").

### FEAT-14 — Tone Selection
**User story:** As a user, I might want to start with a polite request before escalating to a formal legal notice.
**Acceptance criteria:** Two Jinja2 template variants per `notice_template_id` — "request" and "formal_notice" — user picks before generation, can regenerate with the other tone without re-entering data.

### FEAT-15 — Editable Document Draft Generation (PDF)
**User story:** As a user, I want a professional, ready-to-send document, not a text blob I have to format myself.
**Acceptance criteria:** Jinja2 HTML → WeasyPrint PDF. Includes: user details, opposing party, facts, cited sections (verbatim from Stage 3, never regenerated by the LLM), relief sought, date, signature line.

### FEAT-16 — Mandatory Disclaimer
**User story:** (Compliance feature — protects both user and team.)
**Acceptance criteria:** Hardcoded text, present on: every PDF page footer, the results screen, and the document-generation confirmation step. Never passed through the LLM. Exact text: *"This document is generated by an AI assistant for informational purposes only and does not constitute legal advice. Consult a licensed advocate before taking legal action."*

### FEAT-17 — Document Download
**Acceptance criteria:** Signed, time-limited download URL (not a permanently public S3-style link) — see Security doc SEC-08.

### FEAT-18 — Document Regeneration
**User story:** As a user, if I made a mistake or want a different tone, I don't want to start the whole flow over.
**Acceptance criteria:** `PUT /api/document/{id}` re-renders from stored entities without re-running classification/extraction.

### FEAT-19 — Session History
**User story:** As a returning user, I want to see my past cases if I come back later.
**Acceptance criteria:** Requires FEAT-23's session token to persist; list view of past `sessions` with date + domain + status.

### FEAT-20 — Multi-Domain Coverage
**Acceptance criteria:** Minimum viable: consumer, labor, tenant, each with ≥5 issue types and a populated, verified `kb_entries` set (see Technical Spec Phase 8).

### FEAT-21 — Source Citation Transparency Panel
**User story:** As a user or judge, I want to verify where a cited section actually comes from, not just trust the app.
**Acceptance criteria:** Expandable panel showing `kb_entries.source_url` and `last_verified_date` for every cited section — directly supports the "legal accuracy" judging criterion with auditability.

### FEAT-22 — State-Wise Issue Frequency (optional)
**Acceptance criteria:** Sourced from the "Crime in India" Kaggle dataset for context only — clearly labeled as statistical context, never presented as legal guidance.

### FEAT-23 — Anonymous Session Mode
**User story:** As someone in a vulnerable legal situation, I might not want to create an account just to get an explanation.
**Acceptance criteria:** Session token issued on first intake without requiring email/password; optional upgrade to a full account for FEAT-19 history.

### FEAT-24 — Admin KB Editor (stretch)
**Acceptance criteria:** Simple authenticated CRUD screen over `kb_entries`, restricted to team/admin role — reduces need to hand-edit JSON/SQL during the hackathon.

### FEAT-25 — Accessibility-First UI
**Acceptance criteria:** Minimum 16px body text, WCAG AA color contrast, and a "simpler language" toggle that swaps in shorter sentences for the Stage 4 explanation prompt.

---

## 4. Feature-to-Legal-Citation Dependency Map

Every feature marked "Cites Law" in §2 depends on the accuracy of `kb_entries`. This table exists so that when you update the KB (e.g., correcting a BNS mapping), you know exactly which features to re-test.

| kb_entries field | Consumed by |
|---|---|
| `act_name`, `section_number`, `law_code` | FEAT-07, FEAT-08, FEAT-11, FEAT-21 |
| `section_text_plain` | FEAT-09 (as LLM input), FEAT-10 (as guard reference) |
| `remedy_forum` | FEAT-13 |
| `limitation_period` | FEAT-12 |
| `notice_template_id` | FEAT-14, FEAT-15 |
| `source_url`, `last_verified_date` | FEAT-21 |

---

## 5. Out of Scope (this round)

- Real-time chat with a human lawyer
- E-filing directly with courts/commissions
- Payment processing for advocate referrals
- Multi-turn negotiation simulation with the opposing party

Stating this explicitly in your submission prevents judges from marking down for "missing" features that were never in the problem statement.
