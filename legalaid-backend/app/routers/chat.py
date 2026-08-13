import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.config import settings
from app.core.rate_limit import limiter
from app.models.case import Intake
from app.models.kb import KBEntry
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm.provider import generate_llm_response
from app.services.llm.hallucination_guard import guard_hallucinations

router = APIRouter()
logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are LegalAId, a knowledgeable, empathetic Indian legal advisor conversing directly with an aggrieved citizen.

STRICT TONE & FORMATTING RULES:
1. Speak directly, warmly, and authoritatively like a human legal expert in India.
2. DO NOT use robotic AI disclaimers like "Remember, consult a lawyer", "As an AI model", or "To address your issue consider".
3. DO NOT output raw markdown asterisks (like '* **File a police complaint**' or '* **Send notice**'). Output clean, numbered paragraphs or plain sentences.
4. Ground your advice strictly in verified Indian laws (Consumer Protection Act 2019, Labor Laws, Rent Control Acts, IPC/BNS).
5. Keep your answer practical, clear, and under 180 words.
"""

@router.post("/intake/{intake_id}/chat", response_model=ChatResponse, status_code=200)
@limiter.limit(settings.RATE_LIMIT)
async def chat_with_intake(
    intake_id: uuid.UUID,
    chat_req: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Interactive Q&A chat endpoint allowing users to ask follow-up questions
    about their legal intake, remedies, claims, and procedures.
    """
    logger.info(f"Chat request for intake: {intake_id}")

    # Fetch Intake
    stmt = select(Intake).where(Intake.id == intake_id)
    result = await db.execute(stmt)
    intake = result.scalar_one_or_none()

    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # Fetch KB Entries
    kb_stmt = select(KBEntry)
    kb_result = await db.execute(kb_stmt)
    kb_entries_db = kb_result.scalars().all()

    kb_dicts = [
        {
            "act_name": kb.act_name,
            "section_number": kb.section_number,
            "law_code": kb.law_code,
            "section_text_plain": kb.section_text_plain,
            "remedy_forum": kb.remedy_forum,
            "limitation_period": kb.limitation_period
        }
        for kb in kb_entries_db
    ]

    # Build Conversation Context
    history_str = ""
    for msg in (chat_req.history or []):
        role_label = "USER" if msg.role == "user" else "ASSISTANT"
        history_str += f"{role_label}: {msg.content}\n"

    user_prompt = (
        f"USER CASE FACT DESCRIPTION:\n\"{intake.raw_text}\"\n\n"
        f"PREVIOUS CHAT HISTORY:\n{history_str}\n"
        f"CURRENT USER QUESTION:\n\"{chat_req.message}\"\n\n"
        f"Provide a helpful, accurate, plain-language answer."
    )

    try:
        reply_text, provider_used = await generate_llm_response(
            prompt=user_prompt,
            system_prompt=CHAT_SYSTEM_PROMPT
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        raise HTTPException(status_code=502, detail=f"LLM chat service unavailable: {str(e)}")

    # Apply Hallucination Guard
    sanitized_reply, hallucinated, _ = guard_hallucinations(
        explanation_text=reply_text,
        allowed_kb_entries=kb_dicts
    )

    return ChatResponse(
        intake_id=intake_id,
        reply=sanitized_reply,
        provider_used=provider_used,
        hallucination_guarded=hallucinated
    )
