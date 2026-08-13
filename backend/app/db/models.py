import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    user_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    intakes = relationship("Intake", back_populates="session", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="session", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class Intake(Base):
    __tablename__ = "intakes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    raw_text = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="intakes")
    classification = relationship("Classification", back_populates="intake", uselist=False, cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="intake", cascade="all, delete-orphan")


class Classification(Base):
    __tablename__ = "classifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    intake_id = Column(String(36), ForeignKey("intakes.id", ondelete="CASCADE"), nullable=False, unique=True)
    domain = Column(String(50), nullable=False, index=True)       # 'consumer', 'labor', 'tenant'
    issue_type = Column(String(100), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    clarification_needed = Column(Boolean, default=False)
    candidate_matches = Column(JSON, nullable=True)

    intake = relationship("Intake", back_populates="classification")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    intake_id = Column(String(36), ForeignKey("intakes.id", ondelete="CASCADE"), nullable=False)
    entity_type = Column(String(50), nullable=False)   # 'date', 'amount', 'party_name', 'address'
    entity_value = Column(Text, nullable=False)
    confirmed_by_user = Column(Boolean, default=False)

    intake = relationship("Intake", back_populates="entities")


class KBEntry(Base):
    __tablename__ = "kb_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    domain = Column(String(50), nullable=False, index=True)
    issue_type = Column(String(100), nullable=False, index=True)
    law_code = Column(String(20), nullable=False)                # 'IPC', 'BNS', 'N/A'
    act_name = Column(String(200), nullable=False)
    section_number = Column(String(100), nullable=False)
    section_text_plain = Column(Text, nullable=False)
    plain_summary_seed = Column(Text, nullable=False)
    remedy_forum = Column(Text, nullable=False)
    limitation_period = Column(String(100), nullable=False)
    notice_template_id = Column(String(100), nullable=False)
    source_url = Column(Text, nullable=False)
    last_verified_date = Column(Date, default=date.today)

    documents = relationship("Document", back_populates="kb_entry")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    kb_entry_id = Column(String(36), ForeignKey("kb_entries.id"), nullable=False)
    tone = Column(String(50), default="formal_notice")           # 'request', 'formal_notice'
    pdf_path = Column(Text, nullable=False)
    disclaimer_rendered = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="documents")
    kb_entry = relationship("KBEntry", back_populates="documents")


class StatuteChunk(Base):
    __tablename__ = "statute_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    act_name = Column(String(200), nullable=False)
    section_number = Column(String(50), nullable=True)
    law_code = Column(String(20), nullable=False)
    domain_hint = Column(String(50), nullable=True)
    chunk_text = Column(Text, nullable=False)
    source_url = Column(Text, nullable=False)
    last_verified_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False)                     # 'user' | 'assistant'
    content = Column(Text, nullable=False)
    retrieved_chunk_ids = Column(JSON, nullable=True)             # JSON list of UUID strings
    grounding_passed = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="chat_messages")
