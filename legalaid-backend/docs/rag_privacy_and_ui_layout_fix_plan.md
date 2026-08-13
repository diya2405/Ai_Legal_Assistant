# 📐 LegalAId RAG Pipeline, Session Privacy & UI Layout Master Fix Plan

> **Goal**: 
> 1. Formally detail the **Retrieval-Augmented Generation (RAG)** pipeline.
> 2. Ensure **Strict User Data Isolation & Privacy** for Anonymous History.
> 3. Fix the **UI Whitespace Bug** shown in the user's screenshot by capping the Rights Summary container height with internal scrolling and clean Markdown rendering.

---

## 🧠 1. RAG (Retrieval-Augmented Generation) Architecture

To ensure outputs are **not purely generative/AI-hallucinated**, LegalAId employs a 4-layer local RAG pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEGALAID RAG PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ [1. USER INTAKE] ──► [2. LOCAL EMBEDDING & VECTOR SIMILARITY SEARCH]         │
│                      • SentenceTransformers (paraphrase-multilingual-MiniLM) │
│                      • Cosine similarity against Supabase PostgreSQL KB     │
│                                           │                                 │
│                                           ▼                                 │
│                      [3. HUMAN-AUDITED STATUTORY KNOWLEDGE BASE]            │
│                      • Consumer Protection Act 2019, Section 2(10), Sec 35   │
│                      • Transfer of Property Act, Industrial Disputes Act    │
│                      • Official India Code Source URLs                       │
│                                           │                                 │
│                                           ▼                                 │
│ [5. REGEX HALLUCINATION GUARD] ◄── [4. GROQ LLM PLAIN-LANGUAGE TRANSLATOR]  │
│ • Strips any section numbers      • System prompt restricts citations strictly│
│   not in retrieved KB context       to retrieved statutory context              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why it is NOT purely AI-based:
- **Statutory Retrieval**: Section numbers, act names, limitation periods (2 years), and India Code URLs are fetched from **human-audited PostgreSQL tables (`kb_entries`)**.
- **LLM Role**: The LLM is used **strictly to translate** formal statutory text into plain, empathetic Hindi/English for first-generation litigants.
- **Hallucination Guard**: Any law code or section number mentioned by the LLM that was not retrieved from the human KB is automatically purged.

---

## 🔒 2. Session Privacy & Anonymous Case History Model

### Privacy Rules:
1. **100% User Isolation**: Each user is assigned an HTTP-Only anonymous session cookie (`legalaid_session`).
2. **Private Case Drawer**: When opening the History Drawer, the API executes:
   ```sql
   SELECT * FROM intakes WHERE session_id = :current_user_session_id;
   ```
   Users **CANNOT** see or query other users' grievance descriptions, phone numbers, or monetary claims.
3. **Public Aggregate Counter**: The UI displays an anonymous platform metric (e.g. *"1,248 Legal Cases Analyzed | 100% Session Privacy Preserved"*) without exposing any user text.

---

## 🎨 3. UI Layout Fix Plan (Eliminating Whitespace Gaps)

### The Whitespace Bug (Identified in Screenshot #2):
In Screen 2 (`LegalExplanation.tsx`), the right column (Rights Summary) was expanding to 800px+ height due to long text, while the left column (Verified Provisions) was only ~250px tall. Because of CSS grid alignment, this left a **huge empty whitespace gap** on the left before the lower cards ("What Should I Do Next") started.

### Solution & Improvements:
1. **Fixed Container Height with Smooth Internal Scrollbar**:
   - Set `maxHeight: '480px'`, `overflowY: 'auto'` on the Plain-Language Rights Summary card.
   - Ensures left and right columns stay balanced (~480px height) regardless of explanation length.
2. **Clean Markdown Formatting**:
   - Parse raw markdown headers (`### Part 1: ...`, `**Gather Evidence**`) into formatted HTML headings and bold text instead of displaying raw `###` symbols.
3. **Section Separation**:
   - Place lower cards ("What Should I Do Next" & "Supporting Documents") in a clean 2-column container directly beneath the top dashboard.

---

## 🛠️ 4. Implementation Step Checklist

- [x] **Document Plan**: Save `docs/rag_privacy_and_ui_layout_fix_plan.md`.
- [ ] **Fix UI Whitespace & Markdown Rendering**: Update `src/components/LegalExplanation.tsx` with max-height scroll and clean text formatting.
- [ ] **Enhance Privacy History Drawer**: Ensure `HistoryDrawer.tsx` displays privacy badge and strictly filters user session cases.
- [ ] **Add RAG Transparency Badge**: Display explicit RAG breakdown badge on Screen 2 (*"SentenceTransformers Local Vector Search + 100% Grounded KB"*).
- [ ] **Verify Build**: Run `npm run build` and test E2E connectivity.
