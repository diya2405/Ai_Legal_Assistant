"""Document model for generated legal notice PDFs."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, DateTime,
    ForeignKey, text, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db import Base


class Document(Base):
    """Stores metadata for generated legal notice/complaint PDFs.
    
    Each document is linked to an intake (for the case facts),
    a session (for ownership enforcement), and tracks the tone,
    template used, storage path, and signed download URL token.
    """
    __tablename__ = "documents"

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
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kb_entry_id = Column(
        UUID(as_uuid=True),
        ForeignKey("kb_entries.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tone = Column(String(20), nullable=False, default="request")
    template_id = Column(String(100), nullable=True)
    signed_url_token = Column(String(255), nullable=True, unique=True)
    storage_path = Column(Text, nullable=False)
    generated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "tone IN ('request', 'formal')",
            name="ck_documents_tone_valid",
        ),
    )

    # Relationships
    session = relationship("Session", back_populates="documents")

    def __repr__(self):
        return f"<Document(id={self.id}, tone={self.tone}, intake={self.intake_id})>"
