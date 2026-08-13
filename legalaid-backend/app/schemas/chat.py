from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text content")

class ChatRequest(BaseModel):
    message: str = Field(..., description="Current user query")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation history")

class ChatResponse(BaseModel):
    intake_id: uuid.UUID
    reply: str
    provider_used: str
    hallucination_guarded: bool = True
