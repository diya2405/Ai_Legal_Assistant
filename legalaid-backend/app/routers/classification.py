from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging
import uuid

from app.db import get_db
from app.config import settings
from app.core.rate_limit import limiter
from app.schemas.classification import ClassificationResponse, ClassificationMatch
from app.models.case import Intake, Classification
from app.models.kb import KBEntry
from app.services.nlp.classifier import find_best_matches
from fastapi import Request

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/intake/{intake_id}/classify", response_model=ClassificationResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT)
async def classify_intake(
    intake_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Given an intake ID, run the NLP classification model to find the best matching
    Knowledge Base entries and store the result.
    """
    logger.info(f"Classifying intake: {intake_id}")
    
    # 1. Fetch Intake
    stmt = select(Intake).where(Intake.id == intake_id)
    result = await db.execute(stmt)
    intake = result.scalar_one_or_none()
    
    if not intake:
        raise HTTPException(status_code=404, detail="Intake not found")
        
    # 2. Fetch all KB entries to compare against
    kb_stmt = select(KBEntry)
    kb_result = await db.execute(kb_stmt)
    kb_entries_db = kb_result.scalars().all()
    
    if not kb_entries_db:
        raise HTTPException(status_code=500, detail="Knowledge base is empty. Please seed KB data first.")
        
    # Convert KB entries to dictionaries for the NLP service
    kb_dicts = []
    for kb in kb_entries_db:
        kb_dicts.append({
            "id": kb.id,
            "domain": kb.domain,
            "issue_type": kb.issue_type,
            "act_name": kb.act_name,
            "section_number": kb.section_number,
            "description": kb.section_text_plain
        })
        
    # 3. Run SentenceTransformers cosine similarity
    matches = find_best_matches(
        query_text=intake.raw_text,
        kb_entries=kb_dicts,
        top_k=3,
        similarity_threshold=0.3
    )
    
    if not matches:
        logger.warning(f"No matches found for intake {intake_id} with confidence >= 0.3")
        
    # 4. Save best match to database
    # For MVP, we'll just save the top match if it exists.
    classifications = []
    response_matches = []
    
    classification_id = uuid.uuid4()
    
    if matches:
        best_match = matches[0]
        classification = Classification(
            id=classification_id,
            intake_id=intake_id,
            domain=best_match["domain"],
            issue_type=best_match["issue_type"],
            confidence=best_match["confidence_score"],
            needs_clarification=best_match["confidence_score"] < 0.5
        )
        db.add(classification)
        
        # Build response matches
        for m in matches:
            response_matches.append(ClassificationMatch(
                kb_id=m["id"],
                domain=m["domain"],
                issue_type=m["issue_type"],
                confidence_score=m["confidence_score"]
            ))
            
    await db.commit()
    
    return ClassificationResponse(
        classification_id=classification_id,
        intake_id=intake_id,
        matches=response_matches,
        message=f"Found {len(response_matches)} matches."
    )
