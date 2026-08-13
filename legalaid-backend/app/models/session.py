"""Session model for anonymous and authenticated user sessions."""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db import Base


class Session(Base):
    """Stores anonymous user sessions.
    
    Each session is identified by a UUID and authenticated via a
    hashed token stored in an HttpOnly cookie. Sessions are created
    on first intake and track user activity timestamps.
    """
    __tablename__ = "sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    token_hash = Column(String(255), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )
    last_active = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    intakes = relationship("Intake", back_populates="session", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Session(id={self.id}, created_at={self.created_at})>"
