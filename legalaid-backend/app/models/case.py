"""Case-related models: Intake, Classification, and Entity."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Float, Boolean, DateTime,
    ForeignKey, text, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db import Base


class Intake(Base):
    """Stores raw user text submissions for legal issue analysis.
    
    Each intake captures the user's description of their legal problem
    (max 2000 chars), detected language, and links to the owning session.
    """
    __tablename__ = "intakes"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    raw_text = Column(Text, nullable=False)
    language = Column(String(10), nullable=True)  # 'en', 'hi', or null (auto-detected later)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint("char_length(raw_text) <= 2000", name="ck_intakes_text_max_2000"),
    )

    # Relationships
    session = relationship("Session", back_populates="intakes")
    classification = relationship(
        "Classification",
        back_populates="intake",
        uselist=False,  # One-to-one
        cascade="all, delete-orphan",
    )
    entities = relationship("Entity", back_populates="intake", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Intake(id={self.id}, lang={self.language})>"


class Classification(Base):
    """Stores the AI classification result for an intake.
    
    Each classification maps an intake to a domain (consumer/labor/tenant),
    specific issue_type, confidence score, and whether clarification is needed.
    One-to-one relationship with Intake.
    """
    __tablename__ = "classifications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    intake_id = Column(
        UUID(as_uuid=True),
        ForeignKey("intakes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One classification per intake
        index=True,
    )
    domain = Column(String(50), nullable=False)  # 'consumer', 'labor', 'tenant'
    issue_type = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    needs_clarification = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "confidence >= 0.0 AND confidence <= 1.0",
            name="ck_classifications_confidence_range",
        ),
    )

    # Relationships
    intake = relationship("Intake", back_populates="classification")

    def __repr__(self):
        return f"<Classification(domain={self.domain}, issue={self.issue_type}, conf={self.confidence})>"


class Entity(Base):
    """Stores extracted entities (names, dates, amounts, addresses) from intake text.
    
    Entities are initially extracted by spaCy NER and regex, then
    presented to the user for review. The confirmed_by_user flag
    tracks whether the user has verified/corrected the entity.
    """
    __tablename__ = "entities"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    intake_id = Column(
        UUID(as_uuid=True),
        ForeignKey("intakes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label = Column(String(50), nullable=False)  # PERSON, ORG, GPE, DATE, MONEY
    value = Column(Text, nullable=False)
    confirmed_by_user = Column(Boolean, nullable=False, default=False)

    # Relationships
    intake = relationship("Intake", back_populates="entities")

    def __repr__(self):
        return f"<Entity(label={self.label}, value={self.value}, confirmed={self.confirmed_by_user})>"
