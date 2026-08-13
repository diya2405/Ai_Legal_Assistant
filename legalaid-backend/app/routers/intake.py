from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.db import get_db
from app.config import settings
from app.core.rate_limit import limiter
from app.schemas.intake import IntakeRequest, IntakeResponse
from app.models.case import Intake, Entity
from app.models.session import Session as DBSession
from app.services.nlp.extractor import detect_language, extract_entities
from sqlalchemy.future import select

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/intake", response_model=IntakeResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT)
async def create_intake(
    request_data: IntakeRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Accepts raw legal text, creates/identifies a session, detects language,
    extracts entities, and saves the intake to the database.
    """
    logger.info("Received new intake request")
    
    import uuid
    
    # 1. Session Management
    session_id = getattr(request_data, "session_id", None)
    if not session_id:
        cookie_session = request.cookies.get("legalaid_session") or request.headers.get("X-Session-ID")
        if cookie_session:
            try:
                session_id = uuid.UUID(cookie_session)
            except Exception:
                pass
                
    if session_id:
        stmt = select(DBSession).where(DBSession.id == session_id)
        res = await db.execute(stmt)
        db_session = res.scalar_one_or_none()
    else:
        db_session = None

    if not db_session:
        session_id = uuid.uuid4()
        db_session = DBSession(id=session_id, token_hash="anonymous_session_token")
        db.add(db_session)
    
    # 2. NLP Pipeline
    lang = detect_language(request_data.raw_text)
    extracted = extract_entities(request_data.raw_text)
    
    # 3. Database Persistence
    intake_id = uuid.uuid4()
    new_intake = Intake(
        id=intake_id,
        session_id=session_id,
        raw_text=request_data.raw_text,
        language=lang
    )
    db.add(new_intake)
    
    db_entities = []
    for ent in extracted:
        e = Entity(
            id=uuid.uuid4(),
            intake_id=intake_id,
            label=ent["label"],
            value=ent["value"]
        )
        db_entities.append(e)
        db.add(e)
    
    # Single round-trip commit
    await db.commit()
    
    logger.info(f"Intake {new_intake.id} created successfully with {len(db_entities)} entities")
    
    # 4. Return response
    return IntakeResponse(
        intake_id=new_intake.id,
        session_id=db_session.id,
        language=lang,
        entities=extracted,
        created_at=new_intake.created_at
    )
