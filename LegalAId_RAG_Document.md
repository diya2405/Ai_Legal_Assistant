# LegalAId — RAG Architecture & Implementation Document
Version 1.0 | Extends the Technical Specification, Features, SRS, Security, NFR, and Antigravity Backend Brief documents

---

## 1. Why RAG Is a Separate Document (and a Separate Layer, Not a Replacement)

The core pipeline (Stages 1–7) guarantees citation accuracy by never letting an LLM generate a legal fact — Stage 3 is a deterministic SQL lookup against a small, hand-verified `kb_entries` table. That guarantee only holds because the KB is narrow and curated.

RAG solves a different problem: **coverage**. Your curated KB can realistically hold maybe 15-30 issue types across 3 domains for a hackathon. Real users will ask things outside that set, or want follow-up questions answered after the initial result. RAG lets you answer those *without* silently falling back to an ungrounded LLM guess — by retrieving actual statute text and forcing the LLM to answer only from what it retrieved.

**Critical architectural rule: RAG output and KB output must never look the same to the user.** A KB-sourced citation (Stage 3) is verified-accurate by construction. A RAG-sourced citation is "best-effort grounded in a retrieved chunk" — much better than raw LLM generation, but not the same guarantee. Mixing them without a visual/labeled distinction would quietly weaken the accuracy claim that's the whole point of your architecture. See §7.

---

## 2. Where RAG Plugs Into the Existing Pipeline

```
                    Stage 2 (classify) → Stage 3 (deterministic KB lookup)
                                              │
                              ┌───────────────┴───────────────┐
                              │                                 │
                      KB entry found                    KB entry NOT found
                      (existing path,                   OR user asks a
                       unchanged)                        follow-up question
                              │                                 │
                       Stage 4 (LLM                    NEW: RAG PIPELINE
                       rephrase + guard)                (this document)
                              │                                 │
                              └───────────────┬─────────────────┘
                                              ↓
                                   Stage 5 (results — clearly
                                   labeled by source: "Verified"
                                   vs "AI-retrieved reference")
```

RAG is additive. It never replaces Stage 3 for issue types your KB already covers — it only activates (a) when Stage 3 returns no match, or (b) for the post-results chat feature.

---

## 3. RAG Pipeline Architecture

```
┌───────────────────────────────────────────────────────────────┐
│ CORPUS INGESTION (offline, one-time + periodic re-run)          │
│ Bare Act PDFs/text → chunk by section → embed → store in        │
│ pgvector table, each chunk tagged with act_name, section_number,│
│ law_code, source_url                                            │
└───────────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────────┐
│ RETRIEVAL (per query)                                           │
│ 1. Embed user's query (same model as ingestion)                 │
│ 2. Hybrid search: vector similarity (pgvector) + keyword/BM25   │
│    (for exact "Section 138" style queries vector search misses) │
│ 3. Return top-k chunks (k=5 default) above a similarity floor   │
│ 4. If nothing clears the floor → ABSTAIN, don't force an answer │
└───────────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────────┐
│ GROUNDED GENERATION                                              │
│ LLM prompt includes ONLY the retrieved chunks as source material│
│ Instructed: answer only from provided chunks, cite only sections│
│ that appear verbatim in the provided chunks, say "I don't have  │
│ information on this" if the chunks don't answer the question    │
└───────────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────────┐
│ GROUNDING VERIFICATION (extends the Stage 4 hallucination guard) │
│ Regex-extract every citation-like pattern in the LLM output.     │
│ Reject the response unless EVERY citation found is also present │
│ in the retrieved-chunk metadata passed into that specific call. │
│ This is stricter than the Stage 4 guard: Stage 4 checks against  │
│ one injected KB entry; this checks against the actual chunks     │
│ retrieved for THIS query, so retrieval and generation can't drift│
└───────────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────────┐
│ RESPONSE — labeled "AI-retrieved reference, not a verified       │
│ citation — confirm with an advocate" + shows the source chunk(s) │
│ used, so the user (or a judge) can verify it themselves          │
└───────────────────────────────────────────────────────────────┘
```

---

## 4. Corpus & Sourcing (Phase 1 — Statutes Only)

**Recommendation: build the RAG corpus from bare act text only for the hackathon.** No case-law interpretation risk, no precedent-applicability reasoning required, and it directly extends the same domains your KB already covers.

| Source | Link | What to pull |
|---|---|---|
| India Code (official, authoritative) | https://www.indiacode.nic.in/ | Full text of Consumer Protection Act 2019, Bharatiya Nyaya Sanhita 2023, Industrial Disputes Act 1947, Model Tenancy Act 2021 — this is your primary, most defensible source |
| Bharatiya Nyaya Sanhita (BNS) dataset | https://www.kaggle.com/datasets/nandr39/bharatiya-nyaya-sanhita-dataset-bns | Structured starting point for BNS chunking — cross-check against India Code before ingesting |
| Indian Penal Code (IPC) Sections Information | https://www.kaggle.com/datasets/dev523/indian-penal-code-ipc-sections-information | Structured IPC sections — useful if you keep a legacy-IPC lookup path alongside BNS |
| Ministry of Labour & Employment | https://labour.gov.in/ | Labour law bare acts and rules |
| Ministry of Housing & Urban Affairs | https://mohua.gov.in/ | Model Tenancy Act, 2021 full text |

**Ingestion rule:** every chunk must retain `source_url` and `last_verified_date` metadata, exactly like `kb_entries` — this is what makes grounding verification (§6) possible, and what lets a judge click through to the real law.

### Phase 2 (optional stretch) — Case Judgments
Only attempt this after Phase 1 is solid and demo-ready.

| Source | Link | Caveat |
|---|---|---|
| Legal Dataset: SC Judgments India (1950–2024) | https://www.kaggle.com/datasets/adarshsingh0903/legal-dataset-sc-judgments-india-19502024 | Judgments can be overruled, distinguished, or jurisdiction-specific — do NOT present a retrieved judgment as settled law without a clear "illustrative precedent, not binding advice" label |
| Indian Kanoon | https://indiankanoon.org/ | Large searchable case-law database — check their terms of use before bulk-scraping; safer to link out to specific judgments than to ingest full text at hackathon scope |

---

## 5. Chunking Strategy

**Chunk by legal section, not by fixed token count.** A sliding-window chunker will cut sections mid-sentence and destroy exactly the boundary that makes a citation meaningful.

- One chunk = one section (or sub-section, for long sections like IPC/BNS provisions with multiple clauses).
- Chunk metadata: `act_name`, `section_number`, `law_code`, `source_url`, `last_verified_date`, `domain_hint` (which of consumer/labor/tenant this section is most relevant to, for filtering).
- Target chunk size: 100–400 tokens. If a section exceeds that, split at sub-clause boundaries (a, b, c...) rather than an arbitrary character count.
- Store the section heading as a prefix in the embedded text (e.g., "Section 138, Negotiable Instruments Act — Dishonour of cheque for insufficiency of funds: ...") — this improves retrieval quality because the model embeds the *topic* alongside the *text*.

---

## 6. Embedding & Vector Store

| Choice | Recommendation | Why |
|---|---|---|
| Vector store | **pgvector extension on your existing PostgreSQL** | You already run Postgres for everything else — adding pgvector avoids a second database system, keeps deployment simple on free-tier hosting, and lets you JOIN retrieval results directly against `kb_entries`/`sessions` in one query |
| Embedding model | Same multilingual model as the classifier: `paraphrase-multilingual-MiniLM-L12-v2`, OR a legal-domain model like `law-ai/InLegalBERT` (trained on Indian court judgments) if you want stronger legal-domain performance | Reusing the classifier's model keeps one dependency instead of two; InLegalBERT is worth evaluating for retrieval quality specifically if you have time, but confirm it has a Hindi-capable variant before committing — verify this yourself, don't assume |
| Hybrid search | Vector similarity + PostgreSQL full-text search (`tsvector`/`tsquery`) combined, not vector-only | Legal queries often include an exact term ("Section 138", "deposit") that keyword search catches better than semantic similarity alone |
| Similarity floor | Set a minimum cosine similarity (start at 0.5, tune empirically) below which the system abstains rather than returning a weak match | Prevents "confidently wrong" answers on genuinely out-of-corpus questions |

---

## 7. UI/Labeling Requirement (Non-Negotiable)

Every piece of legal content the user sees must be visually distinguishable by source:

| Source | Label | Visual treatment |
|---|---|---|
| Stage 3 (curated KB) | "Verified citation" | Solid badge, e.g. green checkmark |
| RAG (grounded retrieval) | "AI-retrieved reference — confirm with an advocate" | Different badge, e.g. amber/outline, plus a "view source" link to the retrieved chunk |

This directly protects your "legal accuracy" judging score — it shows the team understands the *difference* in confidence between a hand-verified fact and a retrieval-grounded one, rather than presenting both with false equivalence.

---

## 8. Follow-Up Chat / Q&A Design

**User story:** After getting initial results, the user can ask a follow-up question ("what if my landlord doesn't respond to the notice?") without restarting the whole intake flow.

**Design:**
1. New `chat_messages` table, linked to `session_id`, storing role (`user`/`assistant`), content, and — for assistant messages — the list of `retrieved_chunk_ids` used to generate that response.
2. Each follow-up question triggers the same Retrieval → Grounded Generation → Verification pipeline as §3, with the addition of conversation context (last 2-3 turns) and the original case's KB entry/entities as additional retrieval context (so "what if they don't respond" resolves against the *user's specific* issue type, not a generic answer).
3. Same abstention rule applies: if retrieval doesn't find relevant grounding for the follow-up, the assistant says so plainly and suggests consulting an advocate — it must never improvise an ungrounded answer just to seem helpful.
4. Rate-limit chat separately from intake (e.g., 15 messages/session/hour) — this is your most LLM-call-heavy feature and the one most likely to burn free-tier quota during judging.

---

## 9. Database Schema Additions

```sql
-- Vector store for statute chunks (requires: CREATE EXTENSION IF NOT EXISTS vector;)
CREATE TABLE statute_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    act_name VARCHAR(200) NOT NULL,
    section_number VARCHAR(50),
    law_code VARCHAR(20) NOT NULL,        -- 'IPC' | 'BNS' | 'N/A'
    domain_hint VARCHAR(50),               -- 'consumer' | 'labor' | 'tenant' | null
    chunk_text TEXT NOT NULL,
    source_url TEXT NOT NULL,
    last_verified_date DATE NOT NULL,
    embedding VECTOR(384),                 -- dimension matches your chosen embedding model
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_statute_chunks_embedding ON statute_chunks
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_statute_chunks_fulltext ON statute_chunks
    USING GIN (to_tsvector('english', chunk_text));

-- Follow-up chat
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    role VARCHAR(10) NOT NULL,             -- 'user' | 'assistant'
    content TEXT NOT NULL,
    retrieved_chunk_ids UUID[],             -- null for user messages
    grounding_passed BOOLEAN,               -- null for user messages
    created_at TIMESTAMP DEFAULT now()
);
```

---

## 10. New/Extended API Endpoints

| Endpoint | Purpose |
|---|---|
| `POST /api/rag/query` | Internal: given a query string + optional domain filter, returns top-k retrieved chunks. Used by both the KB-fallback path and chat. |
| `POST /api/chat/{session_id}/message` | User sends a follow-up question; returns the grounded response + source chunks + `grounding_passed` status |
| `GET /api/chat/{session_id}/history` | Returns prior messages for the session |
| `POST /api/admin/rag/ingest` | Admin-only: triggers re-ingestion of a corpus file into `statute_chunks` |

---

## 11. Accuracy Guardrails Specific to RAG (extends Technical Spec §7 and Security Doc SEC-06/07)

| Guardrail | Detail |
|---|---|
| Grounding verification, not just prompt instructions | Every RAG-generated citation must be checked against the actual retrieved chunks for that query — not the whole corpus, not just "trust the prompt" |
| Abstention over guessing | Below-threshold retrieval → explicit "I don't have information on this" response, never a forced answer |
| Source-labeled UI | RAG output always visually distinct from KB output (§7) — never presented with equal confidence |
| No judgments in Phase 1 | Case law introduces precedent/jurisdiction reasoning that's out of scope for a grounded-retrieval guard — defer to Phase 2, flag clearly if attempted |
| Chunk-level provenance | Every chunk traceable to `source_url` + `last_verified_date`, same standard as `kb_entries` |
| Separate rate limiting | Chat/RAG calls are the most LLM-call-heavy feature — protect your quota and your judging-day reliability |

---

## 12. Antigravity Task Prompts

Add these as Tasks 10–12 to your existing `BACKEND_BRIEF.md` sequence, after Task 9. Same rule applies as the rest of the brief: **Antigravity builds the plumbing, you supply/verify the actual legal source text.**

### Task 10 — Vector Store & Ingestion Pipeline
```
Extend the backend with RAG infrastructure:

1. Add the pgvector extension to the Postgres setup (docker-compose + a migration: CREATE EXTENSION IF NOT EXISTS vector;).
2. Create the statute_chunks table per this schema: [paste §9 schema here].
3. Build app/services/rag/ingest.py: a function that takes a directory of pre-chunked JSON files (structure: { act_name, section_number, law_code, domain_hint, chunk_text, source_url, last_verified_date }), embeds chunk_text using sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2), and upserts into statute_chunks.
4. Build a CLI script scripts/ingest_statutes.py that runs this over app/rag_data/*.json.
5. I will supply the actual chunked legal text myself — populate app/rag_data/ with a schema example file containing 2 PLACEHOLDER entries clearly marked "PLACEHOLDER - VERIFY AGAINST INDIA CODE", do not generate real statute text yourself.
6. Add the ivfflat vector index and the GIN full-text index from the schema.

Run the ingestion script against the placeholder file and confirm 2 rows appear in statute_chunks with non-null embeddings before reporting done.
```

### Task 11 — Retrieval & Grounded Generation
```
Build the RAG query pipeline:

1. app/services/rag/retrieve.py: function retrieve_chunks(query: str, domain_hint: str | None, k: int = 5) -> list[Chunk]. Combine pgvector cosine similarity search with PostgreSQL full-text search (hybrid: run both, merge/deduplicate results, rank by a combined score). Apply a similarity floor (config value, default 0.5) — if no chunk clears it, return an empty list rather than weak matches.
2. app/services/rag/generate.py: function generate_grounded_answer(query: str, chunks: list[Chunk], conversation_context: list[str] | None) -> dict. Prompt must instruct the LLM to answer ONLY using the provided chunks, cite ONLY section numbers present in those chunks, and explicitly say "I don't have information on this specific point" if the chunks don't address the query. If chunks list is empty, skip the LLM call entirely and return the abstention message directly.
3. CRITICAL: build verify_grounding(answer_text: str, chunks: list[Chunk]) -> bool — extract citation-like patterns from answer_text (same regex family as the Stage 4 guard) and confirm every one appears in the section_number/act_name fields of the chunks that were actually passed to the LLM for this call, not the whole corpus. If verification fails, discard and return the abstention message.
4. POST /api/rag/query — wraps retrieve_chunks for internal/admin testing.
5. Write a unit test with mocked chunks and a mocked LLM response containing a citation NOT present in the mocked chunks — confirm verify_grounding rejects it. This test is mandatory.
```

### Task 12 — Follow-Up Chat
```
Build the chat feature:

1. chat_messages table per schema: [paste §9 chat schema here].
2. POST /api/chat/{session_id}/message — takes a user message, retrieves relevant chunks (using retrieve_chunks with the session's domain as domain_hint), builds conversation_context from the last 3 messages in the session, calls generate_grounded_answer, verifies grounding, stores both the user and assistant messages (assistant message stores retrieved_chunk_ids and grounding_passed), returns the response with source chunk metadata for UI display.
3. GET /api/chat/{session_id}/history — returns message list, ownership-checked against the session cookie (same pattern as Task 8's ownership checks).
4. Rate limit: 15 messages/session/hour via slowapi, separate from the intake rate limit.
5. If grounding fails twice in a row for the same question, return the abstention message and log it — do not retry indefinitely.
```

---

## 13. Development Order Recommendation

Build RAG **after** the core pipeline (Tasks 1–9) is fully working and demo-able. RAG is additive value — a working core pipeline with 3 solid KB domains beats a half-working RAG layer bolted onto an unfinished core, both for your own build risk and for how judges will score "does the core thing work."
