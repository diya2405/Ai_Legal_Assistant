# LegalAId — Security Document
**PS-04: AI Legal Rights Assistant for First-Generation Litigants**
Version 1.0 | Backend: Python (FastAPI) | Database: PostgreSQL

---

## 1. Purpose

LegalAId handles a category of data that is easy to underestimate the sensitivity of: descriptions of people's personal legal disputes, often including names, addresses, financial details, and sometimes information about domestic or employment conflicts. This document defines what LegalAId protects against, how, and what's explicitly deferred for a hackathon-scope build vs. what a production version would need.

---

## 2. Data Classification

| Data type | Classification | Examples | Where stored |
|---|---|---|---|
| Raw intake text | Sensitive (personal + potentially special-category) | Full free-text description of the legal dispute | `intakes.raw_text` |
| Extracted PII | Sensitive | Names, addresses, amounts, dates | `entities` table |
| Session identifiers | Sensitive (linkage risk) | Session tokens, session UUIDs | `sessions` |
| Generated legal documents | Sensitive | PDF with full case details | file storage |
| KB legal content | Public | Statute text, section numbers | `kb_entries` |
| Aggregate/anonymized stats | Non-sensitive | State-wise issue frequency (FEAT-22) | separate read-only dataset |

**Design rule that follows from this table:** anything that touches `intakes`, `entities`, or `documents` needs auth-gated access and encryption in transit at minimum. `kb_entries` is the one table safe to expose publicly (e.g., via a "browse the law" feature) since it contains no user data.

---

## 3. Threat Model (STRIDE-lite, scoped to what matters here)

| Threat | Scenario | Mitigation |
|---|---|---|
| **Spoofing** | Attacker impersonates another user's session to read their case | Session tokens are cryptographically random (min 128-bit), HttpOnly + Secure cookies, never guessable UUIDs alone used as auth |
| **Tampering** | Attacker modifies `kb_entries` to inject false legal citations | KB writes restricted to admin role (SEC-05); all writes audit-logged (SEC-11); consider read-only DB role for the app's normal query path |
| **Repudiation** | No record of who/what generated a given document's citations | Every `documents` row stores the exact `kb_entry_id` used — full traceability from PDF back to source law (see SRS FR-08 verification) |
| **Information disclosure** | Legal case details leak to unauthorized parties (other users, logs, error messages) | Row-level access checks, no PII in application logs, no verbose error responses in production (SEC-09) |
| **Denial of service** | Abuse of the LLM endpoint (Stage 4) or PDF generation endpoint drains free-tier quota/costs | Rate limiting per session/IP (SEC-10) |
| **Elevation of privilege** | Regular user reaches admin KB editor (FEAT-24) | Role-based access control, admin routes behind separate auth check, never inferred from client-supplied data |
| **Prompt injection** | User crafts intake text designed to make the LLM output a fabricated citation or ignore instructions | Structural mitigation, not just prompt wording — see SEC-06 |

---

## 4. Authentication & Authorization (SEC-01 to SEC-05)

**SEC-01 — Anonymous-first, upgradeable sessions.** Users can start without an account (FEAT-23). A signed, random session token is issued and stored as an HttpOnly, Secure, SameSite=Strict cookie — never in localStorage (avoids XSS-based token theft).

**SEC-02 — Optional account auth via JWT.** If a user chooses to persist history (FEAT-19), standard email+password with bcrypt/argon2 hashing (never plaintext, never reversible encryption) and short-lived JWT access tokens + refresh token rotation.

**SEC-03 — Password/secret hygiene.** Minimum password policy (length over complexity — 10+ characters), no password reuse checks needed at hackathon scope, but never roll your own hashing — use `passlib` with argon2.

**SEC-04 — Session-to-data ownership check on every request.** Every query touching `intakes`, `entities`, `documents` must filter by the requesting session's ID/user ID at the query level — not just at the UI level. This is the single most common real-world vulnerability class (broken object-level authorization / IDOR) and the easiest one for judges to test by editing a document ID in the URL.

**SEC-05 — Role separation for KB writes.** `kb_entries` writes (FEAT-24 admin editor) require an explicit `admin` role check server-side, never inferred from a hidden frontend route.

---

## 5. LLM-Specific Security (SEC-06 to SEC-07)

**SEC-06 — Prompt injection resistance.** The Stage 4 prompt template must:
1. Clearly delimit user-supplied text from system instructions (e.g., wrap user facts in a labeled block).
2. Never let user text be interpreted as new instructions — treat it purely as data to summarize.
3. Rely on the **structural guard (FR-12 / FEAT-10)** as the real defense, not prompt wording alone — prompt-level defenses are best-effort; the regex-based citation guard is what actually prevents a bad output from reaching the user, because it validates the *output*, not the *input*.

**SEC-07 — LLM output validation before display.** No LLM output reaches the user unvalidated. The citation-guard check (FEAT-10) is a security control, not just a quality control — an attacker-crafted intake that tricks the LLM into fabricating an authoritative-sounding but false legal citation is a real harm vector for this product category specifically (people may act on it).

---

## 6. PostgreSQL-Specific Security (SEC-08 to SEC-09)

**SEC-08 — Query safety.** All queries via SQLAlchemy ORM with parameterized queries — never raw string-interpolated SQL. This is non-negotiable given the free-text nature of the input data (SQL injection surface via intake text if handled carelessly anywhere downstream, e.g. in raw admin search tools).

**SEC-09 — Least-privilege DB roles.** At minimum, two Postgres roles:
- `legalaid_app` — SELECT/INSERT/UPDATE on user data tables, SELECT-only on `kb_entries`
- `legalaid_admin` — full access to `kb_entries`, used only by the admin editor's backend service

Consider Postgres Row-Level Security (RLS) on `intakes`/`entities`/`documents` keyed to `session_id`/`user_id` as defense-in-depth beyond the application-layer check in SEC-04 — belt-and-suspenders, not either/or.

**SEC-10 — Rate limiting.** Per-session and per-IP rate limits on `/api/intake` and `/api/document/generate` (e.g., via `slowapi` for FastAPI) — protects both against abuse and against burning free-tier LLM/PDF-generation quota during the judging period itself.

---

## 7. Transport & Storage Security

| Control | Detail |
|---|---|
| TLS in transit | Enforced at the hosting platform level (Render/Vercel provide this by default) — confirm HTTPS-only, no mixed content |
| PDF storage | Stored with a random, non-guessable filename/key; download URLs are time-limited and tied to session ownership (SEC-04), never a permanently public static path |
| Encryption at rest | Rely on the hosting platform's disk-level encryption (Render/Supabase provide this) — application-level field encryption is a "Should" not "Must" at hackathon scope, but flag it in your README as a known production gap |
| Logging | Application logs must **never** contain raw intake text, extracted PII, or full document content — log intake/session IDs and event types only |

---

## 8. Audit Logging (SEC-11)

Log (without PII) at minimum:
- Every classification event: session_id, domain, issue_type, confidence, timestamp
- Every KB lookup: session_id, kb_entry_id used, timestamp
- Every LLM guard rejection: session_id, timestamp, reason ("citation pattern detected in output") — this log is your evidence trail for judges asking "prove your guard works"
- Every document generation and download: session_id, document_id, timestamp
- Every admin KB write: admin user_id, kb_entry_id, before/after diff, timestamp

---

## 9. Legal & Regulatory Compliance Mapping

| Requirement | Source | How LegalAId addresses it |
|---|---|---|
| Lawful, fair processing of personal data | Digital Personal Data Protection Act, 2023 (India) | Anonymous-first mode minimizes data collection (FEAT-23); explicit disclaimer on data use should be shown at intake, not buried in T&Cs |
| Purpose limitation | DPDP Act, 2023 | Intake text used only for classification/document generation — never repurposed (e.g., not used to train models on user data without separate, explicit consent) |
| Data minimization | DPDP Act, 2023 | Extraction pipeline (FEAT-05) pulls only the entity types actually needed for document generation, not a general-purpose PII harvest |
| Right to erasure | DPDP Act, 2023 | `DELETE /api/session/{id}` should cascade-delete intakes/entities/documents — build this even at hackathon scope, it's cheap and directly demonstrable |
| "Not legal advice" disclosure | General consumer protection principle + problem statement constraint | FEAT-16, hardcoded, never LLM-generated, present on every relevant surface |
| Accuracy of cited law | Implicit in "legal accuracy" judging criterion | FR-08 through FR-12 chain — deterministic retrieval + output validation guard |
| IT Act, 2000 — electronic records | Relevant if documents are treated as formal notices | Ensure generated PDFs are clearly labeled drafts requiring the user's own signature, not implying digital-signature validity they don't have |

---

## 10. Explicitly Deferred (Hackathon-Scope Disclosure)

Be upfront about these in your README rather than silently skipping them — judges respect a clear "known limitation" list far more than an implied claim of production-readiness:

- Formal penetration testing / third-party security audit
- SOC 2 / ISO 27001-style compliance program
- Field-level encryption at rest (relying on platform-level disk encryption instead)
- Multi-factor authentication
- Automated dependency vulnerability scanning in CI (recommend adding `pip-audit` / `npm audit` even at hackathon scope — low cost, real credibility signal)

---

## 11. Pre-Demo Security Checklist

- [ ] No secrets (API keys, DB credentials) committed to the repo — `.env` in `.gitignore`, `.env.example` provided instead
- [ ] All DB queries go through the ORM, none via raw string interpolation
- [ ] Object-ownership check (SEC-04) tested by attempting to access another session's document ID
- [ ] LLM output guard (SEC-06/07) tested with at least one adversarial prompt-injection attempt
- [ ] Disclaimer text present and hardcoded, not LLM-passable
- [ ] Rate limiting active on intake and document-generation endpoints
- [ ] Logs reviewed to confirm no raw PII/intake text is written to them
