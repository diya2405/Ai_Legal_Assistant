import uuid
import secrets
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Response, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db import get_db
from app.models.session import Session as DBSession

router = APIRouter()
logger = logging.getLogger(__name__)


class SessionResponse(BaseModel):
    session_id: uuid.UUID
    token_hash: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/session", response_model=SessionResponse, status_code=201)
async def create_session(
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an anonymous session for first-generation litigants, sets an HTTP-Only cookie,
    and returns session metadata.
    """
    session_id = uuid.uuid4()
    raw_token = secrets.token_hex(16)
    token_hash = f"hash_{raw_token[:12]}"
    
    db_session = DBSession(
        id=session_id,
        token_hash=token_hash
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    
    # Set HTTP-Only Session Cookie
    response.set_cookie(
        key="legalaid_session",
        value=str(session_id),
        httponly=True,
        samesite="lax",
        max_age=86400 * 30  # 30 days
    )
    
    logger.info(f"Created new anonymous session: {session_id}")
    
    return SessionResponse(
        session_id=db_session.id,
        token_hash=db_session.token_hash,
        created_at=db_session.created_at
    )


@router.get("/session", response_model=SessionResponse)
async def get_current_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the active session from cookie or X-Session-ID header.
    Auto-creates a new session if none exists or if invalid.
    """
    session_id_str = request.headers.get("X-Session-ID") or request.cookies.get("legalaid_session")
    
    if session_id_str:
        try:
            session_uuid = uuid.UUID(session_id_str)
            stmt = select(DBSession).where(DBSession.id == session_uuid)
            res = await db.execute(stmt)
            existing_session = res.scalar_one_or_none()
            
            if existing_session:
                return SessionResponse(
                    session_id=existing_session.id,
                    token_hash=existing_session.token_hash,
                    created_at=existing_session.created_at
                )
        except Exception:
            pass

    # Auto-create if no valid session found
    return await create_session(response=response, db=db)


@router.get("/session/intakes")
async def get_session_intakes(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all intakes submitted by the active session.
    """
    from app.models.case import Intake, Classification
    session_id_str = request.headers.get("X-Session-ID") or request.cookies.get("legalaid_session")
    
    if not session_id_str:
        return []

    try:
        session_uuid = uuid.UUID(session_id_str)
        stmt = select(Intake).where(Intake.session_id == session_uuid).order_by(Intake.created_at.desc())
        res = await db.execute(stmt)
        intakes = res.scalars().all()
        
        result = []
        for i in intakes:
            cls_stmt = select(Classification).where(Classification.intake_id == i.id)
            cls_res = await db.execute(cls_stmt)
            cls = cls_res.scalar_one_or_none()
            
            result.append({
                "id": str(i.id),
                "raw_text": i.raw_text,
                "domain": cls.domain.upper() if cls else "GENERAL DISPUTE",
                "created_at": i.created_at.isoformat()
            })
            
        return result
    except Exception as e:
        logger.error(f"Error fetching session intakes: {e}")
        return []
