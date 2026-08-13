import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CitationDetail(BaseModel):
    act_name: str
    section_number: str
    law_code: str
    source_url: Optional[str] = ""


class LegalExplanationRequest(BaseModel):
    session_id: Optional[uuid.UUID] = None


class LegalExplanationResponse(BaseModel):
    intake_id: uuid.UUID
    explanation: str
    rights_summary: str
    citations: List[CitationDetail]
    supporting_documents: List[str] = Field(default=[], description="Case-tailored supporting documents checklist")
    provider_used: str = Field(..., description="LLM provider used ('groq' or 'gemini')")
    hallucination_guarded: bool = Field(
        ..., description="True if unverified citations were detected and removed"
    )

    class Config:
        from_attributes = True
