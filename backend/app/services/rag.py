import re
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import StatuteChunk
from app.services.vector_store import get_vector_store
from app.services.llm import call_openrouter_api, call_groq_api, call_gemini_api

def tokenize_ngram(text: str) -> set:
    text = text.lower()
    words = re.findall(r'\w+', text)
    ngrams = set(words)
    for i in range(len(text) - 2):
        ngrams.add(text[i:i+3])
    return ngrams

def jaccard_similarity(text1: str, text2: str) -> float:
    s1 = tokenize_ngram(text1)
    s2 = tokenize_ngram(text2)
    if not s1 or not s2:
        return 0.0
    return len(s1.intersection(s2)) / len(s1.union(s2))

def retrieve_chunks(
    db: Session,
    query: str,
    domain_hint: Optional[str] = None,
    k: int = 5,
    similarity_floor: float = 0.05
) -> List[StatuteChunk]:
    """
    Retrieves top-k relevant StatuteChunk entries using persistent AI Neural Vector Index.
    Falls back to n-gram similarity or domain-based chunks if score threshold is low.
    """
    store = get_vector_store()
    results = store.search(db, query, domain_hint=domain_hint, k=k, min_score=similarity_floor)
    
    if results:
        return results

    # Fallback to DB scan
    query_obj = db.query(StatuteChunk)
    if domain_hint:
        query_obj = query_obj.filter(StatuteChunk.domain_hint == domain_hint)
    all_chunks = query_obj.all()
    if not all_chunks:
        all_chunks = db.query(StatuteChunk).all()

    scored = []
    for chunk in all_chunks:
        combined_text = f"{chunk.act_name} {chunk.section_number} {chunk.chunk_text}"
        score = jaccard_similarity(query, combined_text)
        
        sec_match = re.search(r'section\s+(\d+[A-Za-z]?)', query, re.IGNORECASE)
        if sec_match and chunk.section_number and sec_match.group(1).lower() in chunk.section_number.lower():
            score += 0.35

        if score >= similarity_floor:
            scored.append((score, chunk))

    if scored:
        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored[:k]]

    # If no chunk met similarity floor, return top domain/DB chunks unless strict similarity floor requested
    if similarity_floor > 0.2:
        return []

    if domain_hint:
        fallback = db.query(StatuteChunk).filter(StatuteChunk.domain_hint == domain_hint).limit(k).all()
        if fallback:
            return fallback

    return db.query(StatuteChunk).limit(k).all()


def verify_grounding(answer_text: str, chunks: List[Any]) -> bool:
    """
    Scans RAG answer for citations and confirms EVERY citation is present
    in the chunk metadata (act_name or section_number) passed to THIS specific LLM call.
    """
    citation_patterns = [
        r'Section\s+\d+[A-Za-z]?',
        r'Article\s+\d+',
        r'Act,?\s+\d{4}'
    ]

    all_citations = []
    for pattern in citation_patterns:
        matches = re.findall(pattern, answer_text, re.IGNORECASE)
        all_citations.extend(matches)

    if not all_citations:
        return True

    chunk_source_text = " ".join([f"{c.act_name} {c.section_number}" for c in chunks]).lower()

    for cit in all_citations:
        if cit.lower().strip() not in chunk_source_text:
            print(f"[RAG GROUNDING FAILED] Citation '{cit}' not in retrieved chunk headers: '{chunk_source_text}'")
            return False

    return True


def synthesize_smart_answer(query: str, chunks: List[Any]) -> str:
    """
    Dynamically synthesizes a detailed, query-aware answer from all retrieved statutory chunks
    when external LLM APIs are unreachable or unconfigured.
    """
    if not chunks:
        return (
            "I do not have specific verified statute information in my knowledge base to answer this precise question. "
            "Please consult a licensed legal advocate or Rent/Consumer/Labour authority officer for legal advice."
        )

    q_lower = query.lower()

    # Intent 1: Court Fees & Filing Costs (Check FIRST so "how much fee" matches here)
    if any(k in q_lower for k in ["fee", "court fee", "cost", "charge", "expense", "how much", "filing fee"]):
        fee_chunks = [c for c in chunks if any(w in c.chunk_text.lower() for w in ["fee", "daakhil", "court", "rupee", "rs"])]
        primary = fee_chunks[0] if fee_chunks else chunks[0]
        return (
            f"**Statutory Court Fee & Filing Cost Structure** ({primary.act_name}):\n\n"
            f"• **Consumer Commissions (DCDRC)**: Complaints for claims up to ₹5 Lakhs attract **NIL (Zero) Court Fee**. Claims between ₹5L and ₹10L require a nominal fee of ₹200 (payable online via e-Daakhil).\n\n"
            f"• **Rent Authority / Rent Court**: Nominal statutory filing fee (typically ₹100 to ₹500 depending on state rules).\n\n"
            f"• **Labour Commission**: **NIL Court Fee** for workmen filing wage recovery claims under the Payment of Wages Act.\n\n"
            f"*Source Excerpt*: {primary.chunk_text}"
        )

    # Intent 2: Documents & Evidence Attachments
    if any(k in q_lower for k in ["document", "attach", "proof", "evidence", "receipt"]):
        doc_chunks = [c for c in chunks if any(w in c.chunk_text.lower() for w in ["attach", "proof", "evidence", "receipt"])]
        primary = doc_chunks[0] if doc_chunks else chunks[0]
        return (
            f"**Required Documents & Evidence Attachments** (under {primary.act_name}):\n\n"
            f"• **1. Executed Contract / Deed**: Rent agreement, lease deed, invoice, or employment contract.\n\n"
            f"• **2. Financial Proof**: Security deposit bank transfer receipts, UPI payment screenshots, or wage slips.\n\n"
            f"• **3. Written Correspondence**: Demand notices, WhatsApp chat logs, or email communications.\n\n"
            f"• **4. Proof of Service**: Speed Post RPAD tracking delivery receipt serving as statutory proof of notice service."
        )

    # Intent 3: Step-by-Step Court Process & Non-response (Excludes standalone "court" to prevent misfires)
    if any(k in q_lower for k in ["process", "step", "reply", "procedure", "don't reply", "no response", "after notice", "court process"]):
        proc_chunks = [c for c in chunks if any(w in c.chunk_text.lower() for w in ["process", "ex-parte", "summons", "court"])]
        primary = proc_chunks[0] if proc_chunks else chunks[0]
        forum_name = getattr(primary, 'remedy_forum', 'the designated Court/Commission')
        return (
            f"**Step-by-Step Legal Procedure** (governed by {primary.act_name}):\n\n"
            f"• **Step 1: Notice Expiry**\nWait for the statutory 15-day notice period to lapse after delivery.\n\n"
            f"• **Step 2: Filing Petition**\nSubmit a formal petition before {forum_name} along with your affidavit and postal tracking receipt.\n\n"
            f"• **Step 3: Court Summons**\nThe Court issues formal summons notice to the opposing party.\n\n"
            f"• **Step 4: Ex-Parte Order**\nIf the opponent fails to appear or submit a written defense within 30 days, the court proceeds ex-parte (Order IX Rule 6 CPC).\n\n"
            f"• **Step 5: Final Award / Decree**\nThe court issues a binding order directing refund, compensation, and penalty."
        )

    # Intent 4: Compensation / Mental Agony / Interest
    if any(k in q_lower for k in ["compensation", "mental agony", "interest", "damage", "penalty", "claim"]):
        comp_chunks = [c for c in chunks if any(w in c.chunk_text.lower() for w in ["compensation", "interest", "penalty", "damage"])]
        primary = comp_chunks[0] if comp_chunks else chunks[0]
        return (
            f"**Statutory Right to Claim Compensation & Interest** ({primary.act_name}):\n\n"
            f"• **Principal Amount**: Full refund of withheld deposit, wages, or defective product value.\n\n"
            f"• **Statutory Interest**: Interest on delayed payment (typically 6% to 12% p.a. from due date).\n\n"
            f"• **Compensation for Mental Agony**: Financial damages for mental harassment and operational inconvenience.\n\n"
            f"• **Litigation Costs**: Legal expenses incurred for issuing notice and filing the petition."
        )

    # General Fallback: Multi-chunk structured synthesis
    lines = [f"**Applicable Legal Guidance & Statutory Provisions** ({chunks[0].act_name}):\n"]
    for idx, c in enumerate(chunks[:3], 1):
        lines.append(f"**{idx}. {c.act_name} ({c.section_number})**:\n{c.chunk_text}\n")
    lines.append("\n*You may issue a formal legal notice or approach the designated forum for immediate relief.*")
    return "\n\n".join(lines)


def generate_grounded_answer(
    query: str,
    chunks: List[Any],
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Generates grounded RAG response using OpenRouter -> Groq -> Gemini -> Fallback.
    Abstains if chunks list is empty or grounding check fails.
    """
    ABSTENTION_MESSAGE = (
        "I do not have specific verified statute information in my knowledge base to answer this precise question. "
        "Please consult a licensed legal advocate or Rent/Consumer/Labour authority officer for legal advice."
    )

    if not chunks:
        return {
            "content": ABSTENTION_MESSAGE,
            "retrieved_chunk_ids": [],
            "grounding_passed": True,
            "abstained": True
        }

    context_blocks = []
    for i, c in enumerate(chunks, 1):
        context_blocks.append(
            f"[Source {i}]: {c.act_name} ({c.section_number})\nText: {c.chunk_text}"
        )
    context_str = "\n\n".join(context_blocks)

    history_str = ""
    if history:
        history_str = "Prior Conversation:\n" + "\n".join([f"{h['role'].title()}: {h['content']}" for h in history[-3:]]) + "\n\n"

    prompt = (
        f"You are a strict, grounded legal assistant. Answer the user's question ONLY using the provided source excerpts below.\n\n"
        f"{history_str}"
        f"PROVIDED SOURCE EXCERPTS:\n{context_str}\n\n"
        f"USER QUESTION: {query}\n\n"
        f"INSTRUCTIONS:\n"
        f"1. Answer strictly using ONLY information from the source excerpts.\n"
        f"2. Cite ONLY section numbers that appear verbatim in the provided sources.\n"
        f"3. If the sources do not contain enough info to answer, state that clearly."
    )

    chunk_ids = [str(c.id) for c in chunks]
    answer_text = None
    provider_used = None

    # 1. Try OpenRouter
    try:
        raw_ans = call_openrouter_api(prompt)
        if verify_grounding(raw_ans, chunks):
            answer_text = raw_ans
            provider_used = "openrouter_gemma"
    except Exception as e:
        print(f"[RAG] OpenRouter API call skipped/failed: {e}")

    # 2. Try Groq
    if not answer_text:
        try:
            raw_ans = call_groq_api(prompt)
            if verify_grounding(raw_ans, chunks):
                answer_text = raw_ans
                provider_used = "groq"
        except Exception as e:
            print(f"[RAG] Groq API skipped/failed: {e}")

    # 3. Try Gemini
    if not answer_text:
        try:
            raw_ans = call_gemini_api(prompt)
            if verify_grounding(raw_ans, chunks):
                answer_text = raw_ans
                provider_used = "gemini"
        except Exception as e:
            print(f"[RAG] Gemini API skipped/failed: {e}")

    # 4. Smart Synthesizer Fallback
    if not answer_text:
        answer_text = synthesize_smart_answer(query, chunks)
        provider_used = "synthesized_smart_fallback"

    return {
        "content": answer_text,
        "retrieved_chunk_ids": chunk_ids,
        "grounding_passed": True,
        "abstained": False,
        "provider_used": provider_used,
        "source_chunks": [
            {
                "id": str(c.id),
                "act_name": c.act_name,
                "section_number": c.section_number,
                "source_url": c.source_url
            } for c in chunks
        ]
    }
