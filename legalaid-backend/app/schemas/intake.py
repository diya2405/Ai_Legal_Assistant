from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


class IntakeRequest(BaseModel):
    """Request payload for the intake API."""
    raw_text: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="User's description of their legal issue."
    )
    session_id: Optional[uuid.UUID] = Field(
        None,
        description="Optional session ID if already initialized."
    )


class EntityResponse(BaseModel):
    label: str
    value: str
    confirmed_by_user: bool = False

    class Config:
        from_attributes = True


class IntakeResponse(BaseModel):
    """Response returned after processing an intake."""
    intake_id: uuid.UUID
    session_id: uuid.UUID
    language: Optional[str]
    entities: List[EntityResponse]
    created_at: datetime
    message: str = "Intake recorded and entities extracted successfully."

    class Config:
        from_attributes = True
