import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.config import settings
from app.core.rate_limit import limiter
from app.models.case import Intake, Classification
from app.models.kb import KBEntry
from app.schemas.explanation import LegalExplanationResponse, CitationDetail
from app.services.llm.provider import generate_llm_response
from app.services.llm.hallucination_guard import guard_hallucinations
from app.services.nlp.classifier import find_best_matches
from app.services.intake.supporting_docs import generate_case_supporting_docs
from fastapi import Request

router = APIRouter()
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are LegalAId, a knowledgeable, empathetic Indian legal advocate explaining rights directly to an aggrieved citizen.

STRICT TONE & ACCURACY RULES:
1. Speak in a warm, direct, human legal expert tone without robotic disclaimers like "As an AI model" or "Remember, consult a lawyer".
2. DO NOT output raw markdown asterisks (like '* **File a police complaint**' or '* **Send notice**'). Output clean, numbered paragraphs or plain sentences.
3. You MUST ONLY reference laws, acts, and section numbers present in the VERIFIED LEGAL CONTEXT provided.
4. Structure your response into two clear parts:
   Part 1: Clear Plain-Language Explanation (What happened and what your rights are)
   Part 2: Step-by-Step Actionable Remedies (Where to file, limitation period, next steps)
"""


@router.post("/intake/{intake_id}/explain", response_model=LegalExplanationResponse, status_code=200)
@limiter.limit(settings.RATE_LIMIT)
async def explain_intake(
    intake_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a plain-language legal rights explanation with an automated 
    hallucination guard using Groq (primary) and Gemini (fallback).
    """
    logger.info(f"Generating legal explanation for intake: {intake_id}")
    
    # 1. Fetch Intake
    stmt = select(Intake).where(Intake.id == intake_id)
    result = await db.execute(stmt)
    intake = result.scalar_one_or_none()
    
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # 2. Fetch all KB Entries to match
    kb_stmt = select(KBEntry)
    kb_result = await db.execute(kb_stmt)
    kb_entries_db = kb_result.scalars().all()
    
    if not kb_entries_db:
        raise HTTPException(status_code=500, detail="Knowledge Base is empty. Seed entries first.")

    kb_dicts = [
        {
            "id": str(kb.id),
            "domain": kb.domain,
            "issue_type": kb.issue_type,
            "act_name": kb.act_name,
            "section_number": kb.section_number,
            "section_text_plain": kb.section_text_plain,
            "remedy_forum": kb.remedy_forum,
            "limitation_period": kb.limitation_period,
            "law_code": kb.law_code,
            "source_url": kb.source_url,
            "description": kb.section_text_plain
        }
        for kb in kb_entries_db
    ]

    # 3. Find top 3 relevant KB entries for context window
    matches = find_best_matches(
        query_text=intake.raw_text,
        kb_entries=kb_dicts,
        top_k=3,
        similarity_threshold=0.2  # Include top candidate matches
    )

    if matches:
        matched_kb = [m for m in kb_dicts if any(m["id"] == match["id"] for match in matches)]
    else:
        # Fallback to first 2 entries if similarity threshold is low
        matched_kb = kb_dicts[:2]

    # 4. Construct Prompt Context
    context_blocks = []
    for kb in matched_kb:
        context_blocks.append(
            f"--- VERIFIED LEGAL ENTRY ---\n"
            f"Act Name: {kb['act_name']}\n"
            f"Section Number: {kb['section_number']}\n"
            f"Law Code: {kb['law_code']}\n"
            f"Law Provision: {kb['section_text_plain']}\n"
            f"Remedy Forum: {kb['remedy_forum'] or 'N/A'}\n"
            f"Limitation Period: {kb['limitation_period'] or 'N/A'}\n"
        )
    context_str = "\n".join(context_blocks)

    user_prompt = (
        f"USER PROBLEM DESCRIPTION:\n\"{intake.raw_text}\"\n\n"
        f"VERIFIED LEGAL CONTEXT (ONLY CITE LAWS FROM THIS LIST):\n{context_str}\n\n"
        f"Please provide a simplified legal rights explanation and step-by-step guidance."
    )

    # 5. Call LLM Provider (Groq -> Gemini Fallback)
    try:
        raw_llm_text, provider_used = await generate_llm_response(
            prompt=user_prompt,
            system_prompt=SYSTEM_PROMPT
        )
    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        raise HTTPException(status_code=502, detail=f"LLM explanation service unavailable: {str(e)}")

    # 6. Apply Hallucination Guard
    sanitized_explanation, hallucinated, valid_citations = guard_hallucinations(
        explanation_text=raw_llm_text,
        allowed_kb_entries=matched_kb
    )

    # Extract rights summary
    summary_lines = [line for line in sanitized_explanation.split("\n") if line.strip()]
    rights_summary = summary_lines[0] if summary_lines else "Legal rights analysis generated."

    citation_details = [
        CitationDetail(
            act_name=c["act_name"],
            section_number=c["section_number"],
            law_code=c["law_code"],
            source_url=c["source_url"]
        )
        for c in valid_citations
    ]

    supporting_docs = generate_case_supporting_docs(intake.raw_text, matched_kb)

    return LegalExplanationResponse(
        intake_id=intake_id,
        explanation=sanitized_explanation,
        rights_summary=rights_summary,
        citations=citation_details,
        supporting_documents=supporting_docs,
        provider_used=provider_used,
        hallucination_guarded=hallucinated
    )
