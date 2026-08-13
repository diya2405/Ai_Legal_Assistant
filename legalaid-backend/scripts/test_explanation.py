import asyncio
import httpx
import json

async def test_explanation():
    intake_url = "http://127.0.0.1:8002/api/intake"
    payload = {
        "raw_text": "I bought a defective refrigerator from XYZ Electronics for Rs. 45000 on 12th May. They are refusing to repair or replace it under warranty.",
        "session_id": "12345678-1234-5678-1234-567812345678"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("1. Submitting Intake...")
        response = await client.post(intake_url, json=payload)
        
        if response.status_code != 201:
            print(f"Intake failed: {response.status_code}")
            print(response.text)
            return
            
        data = response.json()
        intake_id = data["intake_id"]
        print(f"Intake created: {intake_id}")
        
        # 2. Call Explanation Endpoint
        explain_url = f"http://127.0.0.1:8002/api/intake/{intake_id}/explain"
        print("2. Calling Legal Explanation & Hallucination Guard endpoint...")
        response = await client.post(explain_url, timeout=30.0)
        
        print(f"Explanation Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print("\n--- LEGAL EXPLANATION RESPONSE ---")
            print(f"Provider Used: {result.get('provider_used')}")
            print(f"Hallucination Guarded: {result.get('hallucination_guarded')}")
            print(f"Citations Verified: {len(result.get('citations', []))}")
            for c in result.get('citations', []):
                print(f"  - {c['act_name']} Section {c['section_number']} ({c['law_code']})")
            print("\n--- EXPLANATION TEXT ---")
            print(result.get('explanation'))
        else:
            print(f"Explanation API Failed: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    asyncio.run(test_explanation())
