"""Pydantic schemas for Knowledge Base data validation."""
from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Literal, Optional
from datetime import date


class KBEntrySeed(BaseModel):
    """Schema for validating knowledge base seed data before insertion."""
    
    domain: Literal["consumer", "labor", "tenant"] = Field(
        ..., description="The legal domain this entry belongs to."
    )
    issue_type: str = Field(
        ..., min_length=3, max_length=100, description="Specific issue category."
    )
    act_name: str = Field(
        ..., min_length=3, max_length=200, description="Name of the applicable Act."
    )
    section_number: str = Field(
        ..., min_length=1, max_length=50, description="Applicable section number."
    )
    section_text_plain: str = Field(
        ..., min_length=10, description="Plain text explanation of the section."
    )
    remedy_forum: Optional[str] = Field(
        None, description="Forum where the remedy can be sought (e.g., Consumer Court)."
    )
    limitation_period: Optional[str] = Field(
        None, description="Time limit within which the case must be filed."
    )
    notice_template_id: Optional[str] = Field(
        None, description="Identifier for the document generation template."
    )
    
    # Auditability fields
    law_code: Literal["IPC", "BNS", "N/A"] = Field(
        ..., description="Standardized law code tagging."
    )
    source_url: HttpUrl = Field(
        ..., description="URL to the official government source."
    )
    last_verified_date: date = Field(
        ..., description="Date when this entry was last verified by a legal expert."
    )

    @field_validator("source_url")
    @classmethod
    def convert_url_to_str(cls, v: HttpUrl) -> str:
        return str(v)
