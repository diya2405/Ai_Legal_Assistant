import os
import pytest
from app.services.classification import classify_intake_text
from app.services.extraction import extract_entities
from app.services.llm import verify_citation_guard
from app.services.rag import verify_grounding
from app.services.pdf_generator import generate_legal_pdf

def test_multilingual_classification():
    # English test
    res_en = classify_intake_text("Landlord refuses to return security deposit of 15000")
    assert res_en["domain"] == "tenant"
    assert res_en["issue_type"] == "deposit_not_returned"

    # Devanagari Hindi test
    res_hi = classify_intake_text("मकान मालिक मेरी डिपॉजिट वापस नहीं कर रहा है")
    assert res_hi["domain"] == "tenant"
    assert res_hi["issue_type"] == "deposit_not_returned"

def test_entity_extraction():
    entities = extract_entities("Landlord owes me ₹15,000 since 15 January 2024")
    amounts = [e for e in entities if e["entity_type"] == "amount"]
    dates = [e for e in entities if e["entity_type"] == "date"]
    
    assert len(amounts) > 0
    assert "15,000" in amounts[0]["entity_value"] or "15000" in amounts[0]["entity_value"]
    assert len(dates) > 0

def test_citation_guard_rejects_fabrication():
    kb_section = "Section 10 & 13"
    kb_act = "Model Tenancy Act, 2021"

    # Valid output
    valid_text = "Under the Model Tenancy Act, 2021 (Section 10), your landlord must refund the deposit."
    assert verify_citation_guard(valid_text, kb_section, kb_act) is True

    # Fabricated output (LLM hallucinated Section 420)
    fake_text = "According to Section 420 of the Indian Penal Code, your landlord committed fraud."
    assert verify_citation_guard(fake_text, kb_section, kb_act) is False

def test_rag_grounding_verification():
    class DummyChunk:
        act_name = "Consumer Protection Act, 2019"
        section_number = "Section 35"

    chunks = [DummyChunk()]

    # Valid grounded text
    valid_text = "Under Section 35 of Consumer Protection Act, 2019, a complaint can be filed."
    assert verify_grounding(valid_text, chunks) is True

    # Ungrounded text (mentions Section 138 not in chunks)
    ungrounded_text = "Under Section 138 of Negotiable Instruments Act, file a cheque bounce complaint."
    assert verify_grounding(ungrounded_text, chunks) is False

def test_pdf_generation():
    class DummyKB:
        issue_type = "deposit_not_returned"
        act_name = "Model Tenancy Act, 2021"
        section_number = "Section 10 & 13"
        law_code = "N/A"
        section_text_plain = "Landlord shall refund deposit within 1 month."
        remedy_forum = "Rent Authority"
        limitation_period = "3 years"

    out_path = "tests/test_notice.pdf"
    generate_legal_pdf(
        output_path=out_path,
        tone="formal_notice",
        kb_entry=DummyKB(),
        entities=[{"entity_type": "amount", "entity_value": "₹15,000"}],
        user_name="John Doe",
        opposing_name="Jane Landlord"
    )

    assert os.path.exists(out_path)
    assert os.path.getsize(out_path) > 0
    os.remove(out_path)
