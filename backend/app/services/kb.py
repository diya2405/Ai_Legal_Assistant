from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import KBEntry

def get_kb_entry(db: Session, domain: str, issue_type: str) -> Optional[KBEntry]:
    """
    Deterministic SQL Lookup for KB entries by domain and issue_type.
    NO LLM CALL IS MADE HERE.
    """
    return db.query(KBEntry).filter(
        KBEntry.domain == domain,
        KBEntry.issue_type == issue_type
    ).first()
