import os
import re
import uuid
import urllib.parse
import requests
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import (
    Session as DBSession, Intake, Classification, Entity,
    KBEntry, Document, ChatMessage
)
from app.services.classification import classify_intake_text
from app.services.extraction import extract_entities, extract_structured_case_object
from app.services.kb import get_kb_entry, get_why_this_law_analysis
from app.services.llm import generate_plain_explanation
from app.services.pdf_generator import generate_legal_pdf
from app.services.rag import retrieve_chunks, generate_grounded_answer

router = APIRouter(prefix="/api")

# --- Pydantic Schemas ---
class SessionCreateRequest(BaseModel):
    user_id: Optional[str] = None

class IntakeRequest(BaseModel):
    session_id: str
    raw_text: str
    language: Optional[str] = "en"

class ManualClassifyRequest(BaseModel):
    intake_id: str
    domain: str
    issue_type: str

class EntityUpdateRequest(BaseModel):
    entities: List[Dict[str, Any]]

class ExplanationRequest(BaseModel):
    kb_entry_id: str
    facts: List[Dict[str, Any]] = []
    language: Optional[str] = "en"

class DocumentGenerateRequest(BaseModel):
    session_id: str
    kb_entry_id: str
    tone: Optional[str] = "formal_notice"  # 'request' or 'formal_notice'
    user_name: Optional[str] = "Litigant"
    user_address: Optional[str] = "Not Specified"
    opposing_name: Optional[str] = "Opposing Party"
    opposing_address: Optional[str] = "Not Specified"
    custom_subject: Optional[str] = None
    custom_body: Optional[str] = None

class SaveDraftRequest(BaseModel):
    session_id: str
    kb_entry_id: str
    custom_subject: str
    custom_body: str


class ChatMessageRequest(BaseModel):
    content: str
    domain_hint: Optional[str] = None


# --- Endpoints ---

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        kb_count = db.query(KBEntry).count()
        return {
            "status": "healthy",
            "database": "connected",
            "kb_entries_loaded": kb_count
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@router.post("/session")
def create_session(req: SessionCreateRequest, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())
    session_obj = DBSession(session_token=token, user_id=req.user_id)
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return {
        "session_id": session_obj.id,
        "session_token": session_obj.session_token
    }


@router.post("/intake")
def process_intake(req: IntakeRequest, db: Session = Depends(get_db)):
    # 1. Store Intake (Auto-create session if missing)
    session_obj = db.query(DBSession).filter(DBSession.id == req.session_id).first()
    if not session_obj:
        token = str(uuid.uuid4())
        session_obj = DBSession(id=req.session_id, session_token=token)
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

    detected_lang = req.language or "en"
    if re.search(r'[\u0900-\u097F]', req.raw_text):
        detected_lang = "hi"

    # 2. Run Classification
    cls_res = classify_intake_text(req.raw_text)

    # 3. Extract Structured Case JSON & Entities
    structured_case = extract_structured_case_object(req.raw_text, domain=cls_res["domain"], language=detected_lang)
    extracted = extract_entities(req.raw_text)

    intake_obj = Intake(
        session_id=req.session_id,
        raw_text=req.raw_text,
        language=detected_lang,
        structured_case_json=structured_case
    )
    db.add(intake_obj)
    db.commit()
    db.refresh(intake_obj)

    cls_obj = Classification(
        intake_id=intake_obj.id,
        domain=cls_res["domain"],
        issue_type=cls_res["issue_type"],
        confidence=cls_res["confidence"],
        clarification_needed=cls_res["clarification_needed"],
        candidate_matches=cls_res["candidate_matches"]
    )
    db.add(cls_obj)

    entity_objs = []
    for ext in extracted:
        ent = Entity(
            intake_id=intake_obj.id,
            entity_type=ext["entity_type"],
            entity_value=ext["entity_value"],
            confirmed_by_user=False
        )
        db.add(ent)
        entity_objs.append(ent)

    db.commit()
    db.refresh(cls_obj)

    # 4. Deterministic KB Entry Lookup
    kb_entry = get_kb_entry(db, cls_res["domain"], cls_res["issue_type"])
    if not kb_entry:
        for candidate in cls_res.get("candidate_matches", []):
            kb_entry = get_kb_entry(db, candidate["domain"], candidate["issue_type"])
            if kb_entry:
                break
    if not kb_entry:
        kb_entry = db.query(KBEntry).first()

    kb_data = None
    why_this_law = None

    if kb_entry:
        why_this_law = get_why_this_law_analysis(kb_entry, structured_case, language=detected_lang)
        kb_data = {
            "id": kb_entry.id,
            "domain": kb_entry.domain,
            "issue_type": kb_entry.issue_type,
            "law_code": kb_entry.law_code,
            "act_name": kb_entry.act_name,
            "section_number": kb_entry.section_number,
            "section_text_plain": kb_entry.section_text_plain,
            "plain_summary_seed": kb_entry.plain_summary_seed,
            "plain_summary_seed_hi": getattr(kb_entry, 'plain_summary_seed_hi', None),
            "remedy_forum": kb_entry.remedy_forum,
            "limitation_period": kb_entry.limitation_period,
            "official_source_name": getattr(kb_entry, 'official_source_name', 'India Code'),
            "source_url": kb_entry.source_url,
            "last_verified_date": str(kb_entry.last_verified_date)
        }

    return {
        "intake_id": intake_obj.id,
        "classification": cls_res,
        "structured_case": structured_case,
        "missing_critical_info": structured_case.get("missing_critical_info", []),
        "why_this_law": why_this_law,
        "entities": [
            {
                "id": e.id,
                "entity_type": e.entity_type,
                "entity_value": e.entity_value,
                "confirmed_by_user": e.confirmed_by_user
            } for e in entity_objs
        ],
        "kb_entry": kb_data
    }


@router.post("/classify/manual")
def manual_classify(req: ManualClassifyRequest, db: Session = Depends(get_db)):
    cls_obj = db.query(Classification).filter(Classification.intake_id == req.intake_id).first()
    if not cls_obj:
        raise HTTPException(status_code=404, detail="Intake classification not found")

    cls_obj.domain = req.domain
    cls_obj.issue_type = req.issue_type
    cls_obj.confidence = 1.0
    cls_obj.clarification_needed = False
    db.commit()

    kb_entry = get_kb_entry(db, req.domain, req.issue_type)
    return {
        "status": "updated",
        "domain": req.domain,
        "issue_type": req.issue_type,
        "kb_entry": {
            "id": kb_entry.id,
            "act_name": kb_entry.act_name,
            "section_number": kb_entry.section_number,
            "remedy_forum": kb_entry.remedy_forum,
            "limitation_period": kb_entry.limitation_period
        } if kb_entry else None
    }


@router.put("/entities/{intake_id}")
def update_entities(intake_id: str, req: EntityUpdateRequest, db: Session = Depends(get_db)):
    db.query(Entity).filter(Entity.intake_id == intake_id).delete()
    new_objs = []
    for item in req.entities:
        ent = Entity(
            intake_id=intake_id,
            entity_type=item.get("entity_type", "fact"),
            entity_value=item.get("entity_value", ""),
            confirmed_by_user=True
        )
        db.add(ent)
        new_objs.append(ent)
    db.commit()
    return {"status": "success", "count": len(new_objs)}


@router.post("/explanation")
def generate_explanation(req: ExplanationRequest, db: Session = Depends(get_db)):
    kb_entry = db.query(KBEntry).filter(KBEntry.id == req.kb_entry_id).first()
    if not kb_entry:
        raise HTTPException(status_code=404, detail="KB Entry not found")

    result = generate_plain_explanation(kb_entry, req.facts, language=req.language or "en")
    return result


@router.post("/document/save")
def save_document_draft(req: SaveDraftRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.session_id == req.session_id).order_by(Document.created_at.desc()).first()
    if doc:
        doc.custom_subject = req.custom_subject
        doc.custom_body = req.custom_body
        db.commit()
        return {"status": "saved", "document_id": doc.id}
    return {"status": "ready"}


@router.post("/document/generate")
def generate_document(req: DocumentGenerateRequest, db: Session = Depends(get_db)):
    kb_entry = db.query(KBEntry).filter(KBEntry.id == req.kb_entry_id).first()
    if not kb_entry:
        raise HTTPException(status_code=404, detail="KB Entry not found")

    # Fetch confirmed entities for session
    intake = db.query(Intake).filter(Intake.session_id == req.session_id).order_by(Intake.created_at.desc()).first()
    entities = []
    if intake:
        entities = [{"entity_type": e.entity_type, "entity_value": e.entity_value} for e in intake.entities]

    doc_id = str(uuid.uuid4())
    pdf_filename = f"legal_notice_{doc_id[:8]}.pdf"
    pdf_dir = "/tmp/generated_pdfs" if os.getenv("VERCEL") else os.path.join(os.getcwd(), "generated_pdfs")
    pdf_path = os.path.join(pdf_dir, pdf_filename)

    generate_legal_pdf(
        output_path=pdf_path,
        tone=req.tone or "formal_notice",
        kb_entry=kb_entry,
        entities=entities,
        user_name=req.user_name or "Litigant",
        user_address=req.user_address or "Not Specified",
        opposing_name=req.opposing_name or "Opposing Party",
        opposing_address=req.opposing_address or "Not Specified",
        custom_subject=req.custom_subject,
        custom_body=req.custom_body
    )

    doc_obj = Document(
        id=doc_id,
        session_id=req.session_id,
        kb_entry_id=kb_entry.id,
        tone=req.tone,
        custom_subject=req.custom_subject,
        custom_body=req.custom_body,
        pdf_path=pdf_path,
        disclaimer_rendered=True
    )
    db.add(doc_obj)
    db.commit()

    return {
        "document_id": doc_id,
        "download_url": f"/api/document/download/{doc_id}",
        "filename": pdf_filename,
        "disclaimer_rendered": True
    }


@router.get("/document/download/{doc_id}")
def download_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not os.path.exists(doc.pdf_path):
        raise HTTPException(status_code=404, detail="Document PDF not found")

    return FileResponse(
        doc.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(doc.pdf_path)
    )


@router.post("/chat/{session_id}/message")
def chat_message(session_id: str, req: ChatMessageRequest, db: Session = Depends(get_db)):
    session_obj = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session_obj:
        token = str(uuid.uuid4())
        session_obj = DBSession(id=session_id, session_token=token)
        db.add(session_obj)
        db.commit()
        db.refresh(session_obj)

    # 1. Store user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=req.content
    )
    db.add(user_msg)
    db.commit()

    # 2. Retrieve prior messages for context
    history_objs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in history_objs[:-1]]

    # 3. RAG Retrieval & Generation
    chunks = retrieve_chunks(db, req.content, domain_hint=req.domain_hint)
    rag_res = generate_grounded_answer(req.content, chunks, history=history)

    # 4. Store assistant message
    asst_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=rag_res["content"],
        retrieved_chunk_ids=rag_res["retrieved_chunk_ids"],
        grounding_passed=rag_res["grounding_passed"]
    )
    db.add(asst_msg)
    db.commit()

    return {
        "message_id": asst_msg.id,
        "role": "assistant",
        "content": rag_res["content"],
        "source_chunks": rag_res.get("source_chunks", []),
        "abstained": rag_res.get("abstained", False),
        "grounding_passed": rag_res["grounding_passed"]
    }


@router.get("/chat/{session_id}/history")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "retrieved_chunk_ids": m.retrieved_chunk_ids,
            "grounding_passed": m.grounding_passed,
            "created_at": str(m.created_at)
        } for m in msgs
    ]


@router.get("/tts")
def text_to_speech(text: str, lang: str = "hi"):
    """
    Server-side Text-to-Speech synthesizer proxy endpoint for Hindi and English.
    Bypasses browser CORS restrictions and provides 100% reliable audio stream.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter is required")

    clean_text = re.sub(r'<[^>]*>', '', text)
    clean_text = re.sub(r'[*_#`~]', '', clean_text).strip()

    if not clean_text:
        raise HTTPException(status_code=400, detail="Text contains no speakable content")

    # Split long text into chunks of <= 180 chars for Google TTS engine
    max_chunk = 180
    words = clean_text.split()
    chunks = []
    current_chunk = ""
    for word in words:
        if len(current_chunk) + len(word) + 1 <= max_chunk:
            current_chunk = (current_chunk + " " + word).strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = word
    if current_chunk:
        chunks.append(current_chunk)

    if not chunks:
        chunks = [clean_text[:180]]

    audio_bytes = bytearray()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for chunk in chunks[:6]:  # Limit to 6 chunks max (~1000 chars)
        q = urllib.parse.quote(chunk)
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={q}"
        try:
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code == 200:
                audio_bytes.extend(resp.content)
        except Exception as e:
            print(f"[TTS] Fetch error for chunk: {e}")

    if not audio_bytes:
        raise HTTPException(status_code=502, detail="Failed to synthesize TTS audio stream")

    return Response(content=bytes(audio_bytes), media_type="audio/mpeg")

