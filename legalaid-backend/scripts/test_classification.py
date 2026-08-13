import asyncio
import httpx
import json

async def test_classification():
    # We need to create an intake first, then classify it
    intake_url = "http://127.0.0.1:8002/api/intake"
    payload = {
        "raw_text": "I bought a defective refrigerator from XYZ Electronics for Rs. 45000 on 12th May. They are refusing to replace it.",
        "session_id": "12345678-1234-5678-1234-567812345678"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        print(f"Creating intake...")
        response = await client.post(intake_url, json=payload)
        
        if response.status_code != 201:
            print(f"Failed to create intake: {response.status_code}")
            print(response.text)
            return
            
        data = response.json()
        intake_id = data["intake_id"]
        print(f"Intake created: {intake_id}")
        
        # Now classify
        classify_url = f"http://127.0.0.1:8002/api/intake/{intake_id}/classify"
        print(f"Classifying intake (this may take a bit on first run as it downloads model)...")
        # Extend timeout for model download
        response = await client.post(classify_url, timeout=120.0)
        
        print(f"Status: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(test_classification())
