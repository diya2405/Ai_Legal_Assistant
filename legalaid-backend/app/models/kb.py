"""Knowledge Base model — the core legal citation repository.

This table is the single source of truth for all legal citations
displayed to users. It is populated ONLY by human-verified seed data,
never by LLM-generated content. Every entry must have:
- law_code: explicitly tagged as 'IPC', 'BNS', or 'N/A'
- source_url: link to the official source (e.g., India Code)
- last_verified_date: when the entry was last verified against official sources
"""
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Text, Date, DateTime,
    ForeignKey, Index, text, CheckConstraint,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db import Base


class KBEntry(Base):
    """Human-verified legal knowledge base entries.
    
    Each entry maps a (domain, issue_type) pair to specific legal
    sections, forums, and limitation periods. The LLM is NEVER
    involved in populating or querying this table — it's pure SQL.
    
    Critical indexes:
    - Composite index on (domain, issue_type) for the hot query path
    """
    __tablename__ = "kb_entries"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )
    domain = Column(String(50), nullable=False)  # 'consumer', 'labor', 'tenant'
    issue_type = Column(String(100), nullable=False)
    act_name = Column(String(200), nullable=False)
    section_number = Column(String(50), nullable=False)
    section_text_plain = Column(Text, nullable=False)
    remedy_forum = Column(Text, nullable=True)
    limitation_period = Column(String(255), nullable=True)
    notice_template_id = Column(String(100), nullable=True)
    
    # Law code tagging — NOT NULL, every entry must be explicitly tagged
    law_code = Column(
        String(20),
        nullable=False,
    )
    
    # Citation provenance — required for legal auditability
    source_url = Column(Text, nullable=False)
    last_verified_date = Column(Date, nullable=False)
    
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
        default=datetime.utcnow,
    )

    # Table constraints and indexes
    __table_args__ = (
        # CRITICAL: Composite index on the hot query path (NFR-03: p95 < 100ms)
        Index("idx_kb_domain_issue", "domain", "issue_type"),
        # Ensure law_code is one of the allowed values
        CheckConstraint(
            "law_code IN ('IPC', 'BNS', 'N/A')",
            name="ck_kb_entries_law_code_valid",
        ),
    )

    def __repr__(self):
        return f"<KBEntry(domain={self.domain}, issue={self.issue_type}, section={self.section_number}, law={self.law_code})>"
