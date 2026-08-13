# LegalAId — Non-Functional Requirements (NFR) Document
**PS-04: AI Legal Rights Assistant for First-Generation Litigants**
Version 1.0 | Backend: Python (FastAPI) | Database: PostgreSQL

---

## 1. Purpose

Functional requirements (SRS) say *what* the system does. This document says *how well* it must do it — the quality attributes that determine whether the product is actually usable by a first-generation litigant on a low-end phone, and whether it survives a live judging demo without embarrassment. Every NFR below is written to be testable, not aspirational.

---

## 2. Performance

| ID | Requirement | Target | Rationale |
|---|---|---|---|
| NFR-01 | End-to-end intake → classification response time | p95 < 1.5s | Users on the primary persona (first-time, possibly anxious) will abandon if the "understanding" step feels slow |
| NFR-02 | Classification (Stage 2a) latency alone | p95 < 500ms | Sentence-transformer inference + cosine similarity should be near-instant on pre-embedded exemplars |
| NFR-03 | KB lookup (Stage 3) latency | p95 < 100ms | Pure indexed SQL query — if this is slow, something's architecturally wrong (missing index on `domain`/`issue_type`) |
| NFR-04 | LLM explanation generation (Stage 4) | p95 < 4s | LLM calls are the natural bottleneck; show a loading state, don't block silently |
| NFR-05 | PDF generation (Stage 6) | p95 < 3s for a single-page notice | WeasyPrint is CPU-bound; test on the actual free-tier instance size, not a dev machine |
| NFR-06 | Concurrent demo load | Support 20 concurrent sessions without degradation | Realistic upper bound for a hackathon judging round with multiple judges/testers at once |

**Index requirement (ties to NFR-03):** `CREATE INDEX idx_kb_domain_issue ON kb_entries(domain, issue_type);` — call this out explicitly in your migration; a missing index here is the single most common "forgot" item that silently degrades a Postgres-backed app under any real load.

---

## 3. Scalability

| ID | Requirement |
|---|---|
| NFR-07 | Database connections must use pooling (SQLAlchemy's built-in pool, or PgBouncer if deployed separately) — free-tier Postgres instances have low max-connection limits (often 20-100), and an unpooled FastAPI app under concurrent load will exhaust this fast |
| NFR-08 | Domain/issue-type exemplar sets and KB entries must be added via data (JSON/SQL), never by code changes — adding a 4th domain later should require zero application code edits |

---

## 4. Multilingual & Localization

| ID | Requirement |
|---|---|
| NFR-09 | Classification accuracy on Hindi input must be measured separately from English — do not assume English test results generalize. Build a held-out Hindi test set of at least 5 examples per issue type before demo day |
| NFR-10 | UI strings (buttons, labels, disclaimer) must be translatable — even if only English + Hindi are shipped, don't hardcode English strings inline in components; use a simple i18n key structure from the start, retrofitting this later is expensive |
| NFR-11 | Date and currency formatting must respect Indian conventions (₹ symbol, DD/MM/YYYY, lakh/crore grouping where relevant) |

---

## 5. Reliability & Availability

| ID | Requirement |
|---|---|
| NFR-12 | If Groq API fails or times out, the system must fall back to Gemini automatically within the Stage 4 timeout window, and if both fail, must fall back to the KB's unmodified `plain_summary_seed` text rather than showing an error — **the user must always get a result**, even a less-polished one |
| NFR-13 | Free-tier hosting (Render) may cold-start after inactivity — acceptable for a hackathon demo, but document expected cold-start latency (~30-50s) and consider a pre-demo "warm-up" ping before judging starts |
| NFR-14 | Database migrations must be reversible (Alembic `downgrade()` implemented, not left as `pass`) — a broken migration mid-hackathon with no rollback path is a common, avoidable failure |

---

## 6. Usability

| ID | Requirement |
|---|---|
| NFR-15 | A user with no legal vocabulary must be able to complete intake → result without external help — validate this with at least one non-technical test user (not a teammate) before submission |
| NFR-16 | Reading level of generated explanations (Stage 4 output) should target roughly a Class 8–10 reading level — avoid legalese leaking through even in the "plain language" output |
| NFR-17 | Mobile-first responsive design, functional down to 360px viewport width — the primary persona is far more likely to be on a phone than a laptop |
| NFR-18 | Error states (classification failure, LLM timeout, PDF generation failure) must show a plain-language message and a clear next action, never a raw stack trace or HTTP status code |

---

## 7. Maintainability

| ID | Requirement |
|---|---|
| NFR-19 | KB content (`kb_entries`) must be version-controlled (JSON seed files in git, loaded via a seed script), not edited only via direct production DB access — you need to be able to show judges "here's our commit history of legal corrections" |
| NFR-20 | Code must separate the deterministic pipeline (Stages 1-3, 5-7) from the LLM-touching code (Stage 4) at the module level, not just conceptually — this makes the "no LLM in the citation path" claim independently verifiable by inspecting `services/kb/` vs `services/llm/` |
| NFR-21 | Every `kb_entries` row must carry `source_url` and `last_verified_date` — treat legal content like versioned data with provenance, not static config |

---

## 8. Compliance & Legal (cross-reference: Security Document §9)

| ID | Requirement |
|---|---|
| NFR-22 | The disclaimer (FEAT-16) must be present and rendered before any document can be downloaded — not just "somewhere on the page" |
| NFR-23 | Data retention: session data tied to anonymous sessions should have a defined expiry (e.g., 30 days of inactivity) even if not enforced at hackathon scope — document the intended policy in the README as a compliance-awareness signal |

---

## 9. Observability

| ID | Requirement |
|---|---|
| NFR-24 | Structured logging (JSON logs) for every pipeline stage transition, with correlation via `session_id` — enables you to trace a single user's journey through all 7 stages for debugging during the demo |
| NFR-25 | A lightweight health-check endpoint (`GET /api/health`) that verifies DB connectivity and, ideally, LLM provider reachability — useful for your own pre-demo sanity check and for judges checking system design maturity |

---

## 10. Portability

| ID | Requirement |
|---|---|
| NFR-26 | Backend must run identically via `docker-compose up` locally as it does on Render — avoids "works on my machine" during team development, and makes judging-day setup reproducible if asked |
| NFR-27 | No hardcoded absolute file paths, ports, or environment-specific values in code — all via environment variables with a documented `.env.example` |

---

## 11. Summary: What Most Teams Forget (and you now won't)

This list exists because these are the items that don't show up in a feature demo but are exactly what separates a "well-engineered" score from a "working prototype" score:

1. **Missing DB index** on `kb_entries(domain, issue_type)` — invisible until load, easy to add now (NFR-03)
2. **Connection pool exhaustion** under concurrent judge testing (NFR-07)
3. **No LLM fallback chain actually tested** — teams often build the fallback code but never simulate the primary provider failing (NFR-12)
4. **Hindi tested only superficially** ("it accepted Devanagari text") vs. actually measuring classification accuracy on Hindi (NFR-09)
5. **Reversible migrations** — `alembic downgrade` left unimplemented until it's needed in a panic (NFR-14)
6. **Raw stack traces reaching the user** on any unhandled exception during a live demo (NFR-18)
7. **Disclaimer technically present but easy to miss** — buried in small text rather than a real, checked requirement (NFR-22)
8. **No correlation ID/structured logs** — makes debugging a live judging-round failure much slower than it needs to be (NFR-24)
