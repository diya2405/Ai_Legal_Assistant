import asyncio
import httpx
import json

async def test_intake():
    url = "http://127.0.0.1:8000/api/intake"
    payload = {
        "raw_text": "I bought a defective refrigerator from XYZ Electronics for Rs. 45000 on 12th May. They are refusing to replace it.",
        "session_id": "12345678-1234-5678-1234-567812345678"
    }
    
    async with httpx.AsyncClient() as client:
        print(f"Sending request to {url}...")
        response = await client.post(url, json=payload, timeout=30.0)
        
        print(f"Status: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    asyncio.run(test_intake())
