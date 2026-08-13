import urllib.request
import json
import ssl

def test_e2e():
    print("==========================================================")
    print("      FRONTEND & BACKEND E2E CONNECTIVITY TESTING         ")
    print("==========================================================")

    # 1. Verify React Frontend dev server on 5173
    print("\n[1/5] Checking React Frontend Dev Server (http://localhost:5173)...")
    req = urllib.request.Request("http://localhost:5173/")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        assert "<div id=\"root\"></div>" in html or "vite" in html.lower()
        print("   [OK] React Frontend HTML served cleanly on port 5173!")

    # 2. Test Session Creation API
    print("\n[2/5] Testing Session Creation API (POST /api/session)...")
    req = urllib.request.Request("http://127.0.0.1:8002/api/session", method="POST")
    with urllib.request.urlopen(req) as resp:
        sess_data = json.loads(resp.read().decode('utf-8'))
        session_id = sess_data["session_id"]
        print(f"   [OK] Session initialized: {session_id}")

    # 3. Test Grievance Intake API
    print("\n[3/5] Testing Grievance Intake API (POST /api/intake)...")
    payload = json.dumps({
        "raw_text": "I bought a defective laptop for Rs. 65000 on 10th June. Phone: 9876543210. Seller refuses refund.",
        "session_id": session_id
    }).encode('utf-8')
    req = urllib.request.Request("http://127.0.0.1:8002/api/intake", data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        intake_data = json.loads(resp.read().decode('utf-8'))
        intake_id = intake_data["intake_id"]
        print(f"   [OK] Intake created: {intake_id} | Extracted Entities: {len(intake_data['entities'])}")

    # 4. Test Legal Rights & Verified Citations API
    print("\n[4/6] Testing Legal Rights & Verified Citations API (POST /api/intake/{id}/explain)...")
    req = urllib.request.Request(f"http://127.0.0.1:8002/api/intake/{intake_id}/explain", method="POST")
    with urllib.request.urlopen(req) as resp:
        exp_data = json.loads(resp.read().decode('utf-8'))
        print(f"   [OK] LLM Provider Used: {exp_data['provider_used']} | Hallucination Guarded: {exp_data['hallucination_guarded']}")
        print(f"   [OK] Verified Statutory Citations Returned: {len(exp_data['citations'])}")
        print(f"   [OK] Case-Specific Supporting Documents: {exp_data['supporting_documents']}")

    # 5. Test Interactive Q&A Chat API
    print("\n[5/6] Testing Interactive Q&A Legal Chat API (POST /api/intake/{id}/chat)...")
    chat_payload = json.dumps({
        "message": "Can I claim interest on the 65,000 rupees disputed amount?",
        "history": []
    }).encode('utf-8')
    req = urllib.request.Request(f"http://127.0.0.1:8002/api/intake/{intake_id}/chat", data=chat_payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        chat_data = json.loads(resp.read().decode('utf-8'))
        print(f"   [OK] AI Chat Reply: {chat_data['reply'][:120]}...")

    # 6. Test PDF Legal Notice Document Generation API
    print("\n[6/6] Testing PDF Legal Notice Generation & Download API...")
    doc_payload = json.dumps({
        "tone": "formal",
        "complainant_name": "Anish Sharma",
        "opponent_name": "TechStore India",
        "amount_claimed": "65,000"
    }).encode('utf-8')
    req = urllib.request.Request(f"http://127.0.0.1:8002/api/intake/{intake_id}/document", data=doc_payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        doc_data = json.loads(resp.read().decode('utf-8'))
        download_url = doc_data["download_url"]
        print(f"   [OK] Document PDF Generated: {doc_data['document_id']}")

    # Verify download URL
    full_dl_url = f"http://127.0.0.1:8002{download_url}"
    req = urllib.request.Request(full_dl_url)
    with urllib.request.urlopen(req) as resp:
        pdf_bytes = resp.read()
        assert pdf_bytes.startswith(b"%PDF")
        print(f"   [OK] Downloaded PDF Document Blob successfully ({len(pdf_bytes)} bytes)!")

    print("\n==========================================================")
    print("  [SUCCESS] E2E FRONTEND-TO-BACKEND CONNECTIVITY TEST PASSED 100%!  ")
    print("==========================================================")

if __name__ == "__main__":
    test_e2e()
