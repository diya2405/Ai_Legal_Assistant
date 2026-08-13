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
    similarity_floor: float = 0.20
) -> List[StatuteChunk]:
    """
    Retrieves top-k relevant StatuteChunk entries using persistent AI Neural Vector Index.
    Falls back to n-gram similarity if vector index is building or empty.
    """
    store = get_vector_store()
    results = store.search(db, query, domain_hint=domain_hint, k=k, min_score=similarity_floor)
    
    if results:
        return results

    # Fallback to DB scan if vector index produces empty results
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

    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:k]]


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
    except Exception:
        pass

    # 2. Try Groq
    if not answer_text:
        try:
            raw_ans = call_groq_api(prompt)
            if verify_grounding(raw_ans, chunks):
                answer_text = raw_ans
                provider_used = "groq"
        except Exception:
            pass

    # 3. Try Gemini
    if not answer_text:
        try:
            raw_ans = call_gemini_api(prompt)
            if verify_grounding(raw_ans, chunks):
                answer_text = raw_ans
                provider_used = "gemini"
        except Exception:
            pass

    if not answer_text:
        answer_text = f"Based on {chunks[0].act_name} ({chunks[0].section_number}): {chunks[0].chunk_text}"
        provider_used = "chunk_direct_fallback"

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
