import logging
import httpx
from typing import Tuple
from app.config import settings

logger = logging.getLogger(__name__)

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


async def generate_llm_response(prompt: str, system_prompt: str) -> Tuple[str, str]:
    """
    Generates LLM response using Groq as primary provider and Gemini as fallback.
    Returns tuple: (response_text, provider_name)
    """
    # 1. Try Groq Primary Provider
    if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your_"):
        try:
            logger.info("Attempting LLM generation via Groq...")
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": GROQ_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 1024
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(GROQ_URL, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info("Groq LLM generation succeeded.")
                    return content, "groq"
                else:
                    logger.warning(f"Groq API returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}")

    # 2. Fallback to Gemini
    if settings.GEMINI_API_KEY and not settings.GEMINI_API_KEY.startswith("your_"):
        try:
            logger.info("Attempting LLM generation via Gemini Fallback...")
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"System Instructions: {system_prompt}\n\nUser Prompt: {prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 1024
                }
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(gemini_url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info("Gemini LLM generation succeeded.")
                    return content, "gemini"
                else:
                    logger.error(f"Gemini API returned status {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}")

    # 3. Final Fallback if no LLM provider works
    raise RuntimeError("All LLM providers (Groq and Gemini) failed or have missing API keys.")
