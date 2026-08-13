import os
import uuid
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.config import settings
from app.core.rate_limit import limiter
from app.models.case import Intake, Entity, Classification
from app.models.kb import KBEntry
from app.models.document import Document
from app.schemas.document import GenerateDocumentRequest, GenerateDocumentResponse
from app.services.document.generator import generate_legal_notice_pdf, STORAGE_DIR

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/intake/{intake_id}/document", response_model=GenerateDocumentResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT)
async def generate_document(
    intake_id: uuid.UUID,
    req: GenerateDocumentRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a formal or request legal notice PDF for an intake and saves metadata.
    """
    logger.info(f"Generating legal notice PDF for intake {intake_id} (tone={req.tone})")
    
    # 1. Fetch Intake
    stmt = select(Intake).where(Intake.id == intake_id)
    res = await db.execute(stmt)
    intake = res.scalar_one_or_none()
    
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")

    # 2. Extract Entities (e.g. MONEY amount if not explicitly provided)
    entity_stmt = select(Entity).where(Entity.intake_id == intake_id)
    entity_res = await db.execute(entity_stmt)
    entities = entity_res.scalars().all()
    
    amount_claimed = req.amount_claimed
    if not amount_claimed:
        money_entities = [e.value for e in entities if e.label in ["MONEY", "AMOUNT"]]
        if money_entities:
            amount_claimed = money_entities[0]

    # 3. Fetch KB Entries
    kb_stmt = select(KBEntry)
    kb_res = await db.execute(kb_stmt)
    kb_entries_db = kb_res.scalars().all()
    
    citations = []
    remedy_forum = "Consumer Disputes Redressal Commission / Labor Court"
    limitation_period = "2 Years"
    top_kb_id = None

    if kb_entries_db:
        # Use first 2 entries for citation
        top_kb_id = kb_entries_db[0].id
        remedy_forum = kb_entries_db[0].remedy_forum or remedy_forum
        limitation_period = kb_entries_db[0].limitation_period or limitation_period
        
        citations = [
            {
                "act_name": kb.act_name,
                "section_number": kb.section_number,
                "law_code": kb.law_code,
                "section_text_plain": kb.section_text_plain
            }
            for kb in kb_entries_db[:2]
        ]

    # 4. Create Document Record
    doc_id = uuid.uuid4()
    signed_url_token = secrets.token_urlsafe(32)
    
    storage_path = generate_legal_notice_pdf(
        doc_id=doc_id,
        intake_raw_text=intake.raw_text,
        tone=req.tone,
        complainant_name=req.complainant_name,
        complainant_address=req.complainant_address,
        opponent_name=req.opponent_name,
        opponent_address=req.opponent_address,
        amount_claimed=amount_claimed,
        citations=citations,
        remedy_forum=remedy_forum,
        limitation_period=limitation_period
    )

    doc_record = Document(
        id=doc_id,
        intake_id=intake_id,
        session_id=intake.session_id,
        kb_entry_id=top_kb_id,
        tone=req.tone,
        template_id=req.template_id,
        signed_url_token=signed_url_token,
        storage_path=storage_path
    )
    
    db.add(doc_record)
    await db.commit()

    download_url = f"/api/document/{doc_id}/download?token={signed_url_token}"

    return GenerateDocumentResponse(
        document_id=doc_id,
        intake_id=intake_id,
        session_id=intake.session_id,
        tone=req.tone,
        download_url=download_url,
        signed_url_token=signed_url_token,
        generated_at=doc_record.generated_at
    )


@router.get("/document/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    token: str = Query(..., description="Signed download URL token"),
    db: AsyncSession = Depends(get_db)
):
    """
    Downloads the generated legal notice PDF document.
    """
    stmt = select(Document).where(Document.id == document_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if doc.signed_url_token != token:
        raise HTTPException(status_code=403, detail="Invalid download token")
        
    if not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
        
    return FileResponse(
        path=doc.storage_path,
        media_type="application/pdf",
        filename=f"Legal_Notice_{doc.tone}_{document_id}.pdf"
    )
