import asyncio
import httpx
from app.config import settings

async def test_groq():
    print("Testing Groq API...")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a helpful legal assistant."},
            {"role": "user", "content": "Say hello in 5 words."}
        ],
        "temperature": 0.2
    }
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.post(url, headers=headers, json=payload)
            print(f"Groq status: {res.status_code}")
            print(f"Groq response: {res.text[:200]}")
            return res.status_code == 200
        except Exception as e:
            print(f"Groq error: {e}")
            return False

async def test_gemini():
    print("Testing Gemini API...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={settings.GEMINI_API_KEY}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url)
        print(f"ListModels status: {res.status_code}")
        if res.status_code == 200:
            models = [m["name"] for m in res.json().get("models", []) if "generateContent" in m.get("supportedGenerationMethods", [])]
            print(f"Supported models: {models[:5]}")
            return len(models) > 0
        else:
            print(f"ListModels response: {res.text}")
            return False

async def main():
    groq_ok = await test_groq()
    gemini_ok = await test_gemini()
    print(f"Summary: Groq={groq_ok}, Gemini={gemini_ok}")

if __name__ == "__main__":
    asyncio.run(main())
