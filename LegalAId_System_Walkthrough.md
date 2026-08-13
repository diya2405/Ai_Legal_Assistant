# LegalAId — System Walkthrough: How It All Works
Version 1.0 | A plain-language trace of the full pipeline, from user input to final answer

---

## 1. The One-Paragraph Version

A user types their problem in Hindi or English. The system figures out *what kind* of legal problem it is (NLP classification) and pulls out the *specific facts* (NLP entity extraction). Then — and this is the important part — it does **not** ask an AI "what's the law here?" Instead it looks up the answer in a small, hand-verified table your team built (deterministic KB lookup), the same way a paralegal would flip to a tab in a binder rather than guess from memory. An AI only gets involved *after* that lookup, and only to rephrase the dry legal text into something a non-lawyer can understand — with a safety check that throws away anything the AI adds that wasn't actually in that verified entry. RAG is a second, separate system that only switches on when the hand-verified table doesn't have an answer, and it's held to a stricter, source-checked standard, clearly labeled as less certain than the main path.

Everything below walks through *why* it's built this way and traces one real example through every stage.

---

## 2. Follow One Example Through the Whole System

**User types (in the chat UI):** *"मेरा मकान मालिक मेरी डिपॉजिट वापस नहीं कर रहा है"* (My landlord isn't returning my deposit)

### Step 1 — Intake
The raw text is saved exactly as typed, tagged with a session ID and timestamp. Nothing is processed yet — this is just "receive and store," like a receptionist writing down what you said before passing it to the right department.

### Step 2 — NLP: Understanding *what kind* of problem this is
This is where "NLP" actually does its job, and it's simpler than it sounds. Think of it like a librarian who has read 15-20 example sentences for every type of legal issue, and when you describe your problem, they mentally compare it to all those examples and pick the closest match.

Concretely:
- The system converts the user's sentence into a list of numbers (an "embedding") that represents its *meaning*, not just its words. This is what lets it understand the Hindi sentence above even though none of your example phrases are in Hindi verbatim — the multilingual embedding model captures that "मकान मालिक... डिपॉजिट वापस नहीं" means roughly the same thing as "landlord won't return my deposit," because it's trained to map similar *meanings* to similar numbers regardless of language.
- It compares those numbers against pre-computed numbers for every exemplar phrase in your training set (e.g., 15 phrases for "tenant → deposit_not_returned", 15 for "tenant → illegal_eviction", etc.) using cosine similarity — a standard way to measure "how close are these two meanings."
- Whichever exemplar set is closest wins. In this example: **domain = tenant, issue_type = deposit_not_returned, confidence = 0.81**.

**If confidence had come back low** (say 0.40, because the sentence was vague), the system wouldn't guess — it would ask a clarifying question first, built from the two closest matches. This matters because a wrong classification means the whole rest of the pipeline retrieves the *wrong* law, and there's no downstream safety net that catches "confidently classified the wrong issue."

### Step 3 — NLP: Pulling out the specific facts
Separately, a second NLP tool (Named Entity Recognition, via spaCy) scans the same sentence for concrete facts: dates, money amounts, names, addresses. In our example there isn't an amount mentioned yet, so nothing is extracted here — but if the user had said "he owes me ₹15,000 since March," the system would pull out `₹15,000` and `March` as structured data, ready to drop into the final document later without the user re-typing them.

This step is intentionally dumb and mechanical — regex for money, a standard pre-trained model for names/dates. No legal reasoning happens here, just fact-finding.

### Step 4 — Citation: Looking up the actual law (the accuracy backbone)
This is the step that makes LegalAId different from "ask ChatGPT about your legal rights." With `domain=tenant` and `issue_type=deposit_not_returned` now known, the system runs one plain database query:

```sql
SELECT * FROM kb_entries WHERE domain = 'tenant' AND issue_type = 'deposit_not_returned';
```

That's it. No AI is involved in this step at all. The row that comes back was written and verified by your team ahead of time, cross-checked against the Model Tenancy Act, 2021, with a `source_url` pointing to the official text. Think of it like a lookup table in a cookbook: "if the dish is X, the recipe is on page Y" — the system isn't *inventing* the recipe on the spot, it's retrieving a page that was written and checked in advance.

This is why the earlier project documents call this the "accuracy backbone" — whatever a user asks, as long as it maps to something in this table, the cited law is guaranteed correct because a human verified it, not because an AI happened to get it right this time.

### Step 5 — Where AI actually gets used (and how it's kept on a leash)
The database row from Step 4 has a field called `section_text_plain` — dry, correct, but written in flat legal language. An LLM (Groq, with Gemini as backup) is given *only* that text plus the user's specific facts, with strict instructions: rephrase this warmly and clearly, and do not add any section numbers, act names, or legal claims that weren't already there.

After the AI responds, the system runs a safety check: it scans the AI's output for anything that *looks* like a citation (patterns like "Section 5" or "Article 21"). If it finds one that wasn't in the original verified text, it throws the whole response away and either retries once with a stricter instruction, or falls back to showing the plain verified text unmodified. **The AI is never trusted to introduce a new legal fact — only to make an existing, verified fact more readable.**

### Step 6 — Presenting the result
The user sees three things: the friendly explanation (Step 5's output), the actual law with the forum to file at and how long they have (straight from the verified Step 4 row), and a button to generate a document.

### Step 7 — Document generation
If the user proceeds, their reviewed facts get dropped into a template alongside the *same* verified citation from Step 4 (never regenerated), rendered to a PDF with a fixed, non-AI-generated disclaimer on every page.

---

## 3. What Happens When the Verified Table Doesn't Have an Answer

Say a user describes a workplace issue your `kb_entries` table doesn't cover yet — maybe a very specific gig-economy dispute type you didn't anticipate. Step 4 comes back empty. This is where **RAG** enters, as a completely separate system with a different — and more cautious — standard of trust.

### How RAG works, in plain terms
Imagine your verified `kb_entries` table is a small binder of 20 topics your team personally read and checked. RAG is like handing the AI the *entire bare Act* (the full legal text of the Consumer Protection Act, the labour laws, etc.) chopped into labeled sections, and saying: "go find the 3-5 sections that seem most relevant to this question, and only answer using what's actually written in those sections — if you can't find anything relevant, say so, don't guess."

Concretely:
1. The user's query is turned into the same kind of "meaning numbers" as Step 2, and compared against every chunked section of the full legal corpus (stored as vectors in the database) to find the closest-matching sections.
2. Those matched sections — and *only* those sections — are handed to the AI as its source material.
3. The AI answers, and the same kind of safety check from Step 5 runs again — but stricter: it checks that any citation the AI mentions actually appears in *those specific retrieved sections*, not just anywhere in the whole legal corpus. This stops a subtle failure mode where retrieval finds section A but the AI cites section B from memory instead.
4. If nothing relevant was found above a similarity threshold, the system doesn't force an answer — it tells the user plainly that it doesn't have information on this specific point.

### Why RAG answers are labeled differently
A `kb_entries` answer is correct because a human read the actual law and typed it in. A RAG answer is correct *if and only if* the retrieval step found the right section and the AI didn't misread it — that's a real step better than an ungrounded guess, but it's not the same guarantee. That's why every RAG-sourced answer in the UI carries a visibly different badge ("AI-retrieved reference — confirm with an advocate") instead of the KB path's "Verified citation" badge. The user (and a judge evaluating the project) should always be able to tell which kind of answer they're looking at.

### The other job RAG does: follow-up chat
After a user gets their initial result, they might ask something like "what if my landlord doesn't respond to the notice?" RAG powers this too — same retrieve-then-answer-only-from-retrieved-text pattern, using both the legal corpus and the specifics of the user's own case as context, so the answer is relevant to their actual situation rather than generic.

---

## 4. Side-by-Side: The Two Answer Paths

| | Curated KB path (Steps 4-5) | RAG path |
|---|---|---|
| **When it runs** | Whenever the classified issue_type exists in `kb_entries` — the default, primary path | Only when the KB has no match, or for follow-up chat questions |
| **Source of truth** | A small table your team personally wrote and verified against official law | The full text of bare Acts, chunked and searched at query time |
| **AI's role** | Rephrase already-verified text into plain language — never introduces new facts | Search + answer strictly from retrieved chunks — a wider net, held to a stricter grounding check |
| **Accuracy guarantee** | Correct by construction (a human checked it before it ever went live) | Correct *if retrieval found the right passage* — verified after the fact, not guaranteed in advance |
| **What happens if it can't answer** | Never applicable — every classified issue_type in production has a verified row | Explicitly says "I don't have information on this," never forces a guess |
| **UI label** | "Verified citation" | "AI-retrieved reference — confirm with an advocate" |

---

## 5. Full Flow, End to End

```
User types in Hindi or English
        ↓
Stored as raw intake (Step 1)
        ↓
NLP classification: what domain + issue type? (Step 2)
   → low confidence → ask a clarifying question, loop back
        ↓
NLP entity extraction: what facts (dates, amounts, names)? (Step 3)
   → user reviews/corrects before anything is finalized
        ↓
Deterministic KB lookup: does the verified table have this issue type? (Step 4)
        ├── YES → AI rephrases the verified text + safety-checks its own output (Step 5)
        │            → results shown, labeled "Verified citation"
        │
        └── NO  → RAG: search full legal corpus for relevant sections
                     → AI answers ONLY from what was retrieved + grounding check
                     → results shown, labeled "AI-retrieved reference"
                     → OR: "no information found," suggest an advocate
        ↓
User reviews results, generates a document if needed (Step 6-7)
        ↓
Later: follow-up questions go through RAG + the user's own case context
```

---

## 6. Why This Design (the short version, for your README/pitch)

Most "AI legal assistant" projects are a single LLM call away from confidently making up a law. LegalAId separates *understanding the problem* (NLP classification + extraction) from *knowing the law* (deterministic lookup, or grounded retrieval as a fallback) from *explaining it nicely* (the one and only job the AI actually does unsupervised). Every point where an AI touches something a user might act on has a mechanical check behind it — not just a carefully worded prompt — because prompts are best-effort and checks are enforceable.
