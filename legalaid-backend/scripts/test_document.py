import asyncio
import httpx

async def test_document_pipeline():
    intake_url = "http://127.0.0.1:8002/api/intake"
    payload = {
        "raw_text": "I purchased an OLED TV from ABC Retail for Rs. 85000 on 10th January 2024. The display stopped working within 15 days, and they refused replacement.",
        "session_id": "12345678-1234-5678-1234-567812345678"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("1. Submitting Intake for Document Generation...")
        res = await client.post(intake_url, json=payload)
        if res.status_code != 201:
            print(f"Intake creation failed: {res.status_code}")
            return
            
        intake_id = res.json()["intake_id"]
        print(f"Intake created: {intake_id}")
        
        # 2. Generate PDF Legal Notice (Formal Tone)
        doc_url = f"http://127.0.0.1:8002/api/intake/{intake_id}/document"
        doc_payload = {
            "tone": "formal",
            "complainant_name": "Ramesh Kumar",
            "complainant_address": "Flat 402, Green Enclave, Delhi",
            "opponent_name": "ABC Retail Electronics Ltd.",
            "opponent_address": "Store 12, City Mall, Delhi",
            "amount_claimed": "85,000"
        }
        
        print("2. Requesting Formal Legal Notice PDF Generation...")
        doc_res = await client.post(doc_url, json=doc_payload)
        print(f"Document API Status: {doc_res.status_code}")
        
        if doc_res.status_code == 201:
            doc_data = doc_res.json()
            doc_id = doc_data["document_id"]
            download_url = f"http://127.0.0.1:8002{doc_data['download_url']}"
            print(f"Document Record Created! ID: {doc_id}")
            print(f"Download URL: {download_url}")
            
            # 3. Download Generated PDF
            print("3. Testing PDF Download Endpoint...")
            dl_res = await client.get(download_url)
            print(f"Download Status Code: {dl_res.status_code}")
            print(f"Content-Type: {dl_res.headers.get('content-type')}")
            print(f"PDF Binary Size: {len(dl_res.content)} bytes")
            
            if dl_res.status_code == 200 and "application/pdf" in dl_res.headers.get('content-type', ''):
                print("\n✅ DOCUMENT GENERATION & DOWNLOAD PIPELINE TEST PASSED PERFECTLY!")
        else:
            print(f"Document generation failed: {doc_res.text}")

if __name__ == "__main__":
    asyncio.run(test_document_pipeline())
