import os
import pytest
from app.db.database import SessionLocal
from app.services.classification import classify_intake_text
from app.services.extraction import extract_entities
from app.services.llm import verify_citation_guard
from app.services.rag import retrieve_chunks, generate_grounded_answer, verify_grounding
from app.services.pdf_generator import generate_legal_pdf

def test_tenant_domain_possibilities():
    # 1. Deposit non-refund
    res1 = classify_intake_text("The house owner is withholding my security deposit refund after vacating flat")
    assert res1["domain"] == "tenant"
    assert res1["issue_type"] == "deposit_not_returned"

    # 2. Security deposit withholding variant
    res2 = classify_intake_text("Landlord deducted arbitrary painting charges from my deposit without receipts")
    assert res2["domain"] == "tenant"
    assert res2["issue_type"] == "deposit_not_returned"

    # 3. Illegal Eviction
    res3 = classify_intake_text("Landlord forced me out of flat without notice period or rent court order")
    assert res3["domain"] == "tenant"
    assert res3["issue_type"] == "illegal_eviction"

    # 4. Maintenance Neglect
    res5 = classify_intake_text("Roof is leaking continuously but landlord refuses to repair structural damage")
    assert res5["domain"] == "tenant"
    assert res5["issue_type"] == "maintenance_neglect"


def test_consumer_domain_possibilities():
    # 1. Defective product
    res1 = classify_intake_text("Bought mobile phone online but screen stopped working immediately on arrival")
    assert res1["domain"] == "consumer"
    assert res1["issue_type"] == "defective_product"

    # 2. Defective product warranty refusal
    res2 = classify_intake_text("Shopkeeper sold broken washing machine and refusing warranty replacement")
    assert res2["domain"] == "consumer"
    assert res2["issue_type"] == "defective_product"

    # 3. Deficiency of service
    res3 = classify_intake_text("Paid authorized service center but repair work not completed properly")
    assert res3["domain"] == "consumer"
    assert res3["issue_type"] == "deficiency_of_service"

    # 4. Unfair trade practice (MRP overcharge)
    res4 = classify_intake_text("Retail store charged price higher than printed maximum retail price MRP")
    assert res4["domain"] == "consumer"
    assert res4["issue_type"] == "unfair_trade_practice"


def test_labor_domain_possibilities():
    # 1. Unpaid wages
    res1 = classify_intake_text("Employer delayed monthly salary for 3 consecutive months without written reason")
    assert res1["domain"] == "labor"
    assert res1["issue_type"] == "unpaid_wages"

    # 2. Salary withheld
    res2 = classify_intake_text("Company has withheld my monthly salary payout after I submitted resignation")
    assert res2["domain"] == "labor"
    assert res2["issue_type"] == "unpaid_wages"

    # 3. Wrongful termination
    res3 = classify_intake_text("Fired suddenly from job without notice period or severance pay")
    assert res3["domain"] == "labor"
    assert res3["issue_type"] == "wrongful_termination"

    # 4. Overtime denial
    res4 = classify_intake_text("Employer forced 12 hour daily shifts without paying overtime wages")
    assert res4["domain"] == "labor"
    assert res4["issue_type"] == "overtime_denial"


def test_new_legal_domain_possibilities():
    # 1. Cheque bounce
    res1 = classify_intake_text("A cheque of 50000 rupees bounced due to insufficient funds")
    assert res1["domain"] == "financial"
    assert res1["issue_type"] == "cheque_bounce"

    # 2. Insurance claim rejection
    res2 = classify_intake_text("Health insurance company rejected my cashless hospital claim arbitrarily")
    assert res2["domain"] == "insurance"
    assert res2["issue_type"] == "claim_rejection"

    # 3. Medical negligence
    res3 = classify_intake_text("Doctor performed wrong surgery on my leg causing permanent disability")
    assert res3["domain"] == "medical"
    assert res3["issue_type"] == "medical_negligence"

    # 4. Motor vehicle accident
    res4 = classify_intake_text("Hit and run road accident by speeding truck seeking mact compensation under section 166")
    assert res4["domain"] == "motor"
    assert res4["issue_type"] == "accident_compensation"

    # 5. IP infringement
    res5 = classify_intake_text("Competitor company copied our registered brand trademark name and logo on fake products")
    assert res5["domain"] == "ip"
    assert res5["issue_type"] == "trademark_infringement"

    # 6. Banking CIBIL harassment
    res6 = classify_intake_text("Bank wrongly reported credit card loan default to cibil ruining my credit score")
    assert res6["domain"] == "banking"
    assert res6["issue_type"] == "cibil_harassment"


def test_ai_neural_rag_retrieval_and_case_precedents():
    db = SessionLocal()
    try:
        # 1. Test Neural Vector Embedding retrieval for Consumer Protection Act
        consumer_chunks = retrieve_chunks(db, "defective mobile phone warranty refund deficiency", domain_hint="consumer", k=3)
        assert len(consumer_chunks) > 0
        assert any("Consumer Protection Act" in c.act_name for c in consumer_chunks)
        assert all(c.source_url is not None for c in consumer_chunks)

        # 2. Test Neural Vector Embedding retrieval for BNS / IPC Tenant Dispossession
        tenant_chunks = retrieve_chunks(db, "landlord forcibly dispossessed tenant and cut off electricity", domain_hint="tenant", k=3)
        assert len(tenant_chunks) > 0
        assert any("Bharatiya Nyaya Sanhita" in c.act_name or "Model Tenancy Act" in c.act_name for c in tenant_chunks)

        # 3. Test Supreme Court Precedents Retrieval
        sc_chunks = retrieve_chunks(db, "Supreme Court precedent on deficiency of service by housing development authority", domain_hint="consumer", k=3)
        assert len(sc_chunks) > 0
        assert any("Supreme Court" in c.act_name or "Precedent" in c.chunk_text for c in sc_chunks)

        # 4. Test RAG Abstention on completely irrelevant non-legal query
        unrelated_chunks = retrieve_chunks(db, "how to bake a chocolate cake with strawberry frosting", similarity_floor=0.6, k=3)
        ans = generate_grounded_answer("how to bake a chocolate cake with strawberry frosting", unrelated_chunks)
        assert ans["abstained"] is True
        assert "do not have specific verified statute information" in ans["content"]

    finally:
        db.close()


def test_entity_extraction_possibilities():
    # Test currency amounts, dates, and party names
    text = "Landlord Ramesh Kumar owes me ₹45,000 since 10 October 2023 for flat in Indiranagar"
    entities = extract_entities(text)
    
    amount_ents = [e for e in entities if e["entity_type"] == "amount"]
    date_ents = [e for e in entities if e["entity_type"] == "date"]
    
    assert len(amount_ents) > 0
    assert any("45,000" in e["entity_value"] or "45000" in e["entity_value"] for e in amount_ents)
    assert len(date_ents) > 0


def test_citation_guard_all_cases():
    section = "Section 10 and Section 13"
    act = "Model Tenancy Act, 2021"

    # Valid citation contained in seed
    assert verify_citation_guard(
        "Under Section 10 of Model Tenancy Act, 2021, the landlord must return deposit.",
        section, act
    ) is True

    # Hallucinated citation (Section 420 IPC)
    assert verify_citation_guard(
        "According to Section 420 of IPC, landlord is guilty of fraud.",
        section, act
    ) is False


def test_pdf_generation_tones(tmp_path):
    class DummyKB:
        issue_type = "deposit_not_returned"
        act_name = "Model Tenancy Act, 2021"
        section_number = "Section 10 & 13"
        law_code = "N/A"
        section_text_plain = "Landlord shall refund deposit within 1 month."
        remedy_forum = "Rent Authority"
        limitation_period = "3 years"

    # 1. Formal Notice Tone
    formal_path = str(tmp_path / "formal_notice.pdf")
    generate_legal_pdf(
        output_path=formal_path,
        tone="formal_notice",
        kb_entry=DummyKB(),
        entities=[{"entity_type": "amount", "entity_value": "Rs. 20,000"}],
        user_name="Amit Sharma",
        opposing_name="Rajesh Gupta"
    )
    assert os.path.exists(formal_path)
    assert os.path.getsize(formal_path) > 0

    # 2. Requisition / Request Tone
    request_path = str(tmp_path / "request_notice.pdf")
    generate_legal_pdf(
        output_path=request_path,
        tone="request",
        kb_entry=DummyKB(),
        entities=[{"entity_type": "amount", "entity_value": "Rs. 20,000"}],
        user_name="Amit Sharma",
        opposing_name="Rajesh Gupta"
    )
    assert os.path.exists(request_path)
    assert os.path.getsize(request_path) > 0
