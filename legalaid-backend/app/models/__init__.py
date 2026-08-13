"""SQLAlchemy models package.

All models are imported here so Alembic can discover them
via Base.metadata for migration auto-generation.
"""
from app.models.session import Session
from app.models.case import Intake, Classification, Entity
from app.models.kb import KBEntry
from app.models.document import Document

__all__ = [
    "Session",
    "Intake",
    "Classification",
    "Entity",
    "KBEntry",
    "Document",
]
