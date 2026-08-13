from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class ClassificationMatch(BaseModel):
    kb_id: uuid.UUID
    domain: str
    issue_type: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    
    class Config:
        from_attributes = True

class ClassificationResponse(BaseModel):
    classification_id: uuid.UUID
    intake_id: uuid.UUID
    matches: List[ClassificationMatch]
    message: str = "Classification completed."
    
    class Config:
        from_attributes = True
