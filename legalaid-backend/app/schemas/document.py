import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class GenerateDocumentRequest(BaseModel):
    tone: Literal["request", "formal"] = Field(
        "request", description="Tone of the legal notice: 'request' (polite demand) or 'formal' (strict legal notice)"
    )
    template_id: Optional[str] = "consumer_notice"
    complainant_name: Optional[str] = "Complainant"
    complainant_address: Optional[str] = "Address Not Provided"
    opponent_name: Optional[str] = "Opposing Party / Vendor"
    opponent_address: Optional[str] = "Address Not Provided"
    amount_claimed: Optional[str] = None


class GenerateDocumentResponse(BaseModel):
    document_id: uuid.UUID
    intake_id: uuid.UUID
    session_id: uuid.UUID
    tone: str
    download_url: str
    signed_url_token: str
    generated_at: datetime

    class Config:
        from_attributes = True
