import os
import re
import json
import requests
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

def verify_citation_guard(generated_text: str, kb_entry_section: str, kb_entry_act: str) -> bool:
    """
    Scans LLM-generated output for citation patterns.
    Returns True if citations mentioned in generated_text match the injected KB entry.
    """
    if not generated_text or not generated_text.strip():
        return False

    citation_patterns = [
        r'Section\s+\d+[A-Za-z]?',
        r'Article\s+\d+',
        r'Act,?\s+\d{4}'
    ]

    all_citations = []
    for pattern in citation_patterns:
        matches = re.findall(pattern, generated_text, re.IGNORECASE)
        all_citations.extend(matches)

    if not all_citations:
        return True

    kb_combined_text = f"{kb_entry_section} {kb_entry_act}".lower()
    kb_clean = re.sub(r'[^\w\s]', '', kb_combined_text)

    for citation in all_citations:
        cit_clean = re.sub(r'[^\w\s]', '', citation.strip().lower())
        if cit_clean not in kb_clean:
            numbers = re.findall(r'\d+', citation)
            if numbers and not all(num in kb_clean for num in numbers):
                print(f"[CITATION GUARD FAILED] Fabricated citation detected: '{citation}' not in '{kb_combined_text}'")
                return False

    return True


def call_openrouter_api(prompt: str) -> str:
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise ValueError("OPENROUTER_API_KEY not configured")

    models_to_try = [
        "openrouter/free",
        os.getenv("OPENROUTER_MODEL", "google/gemma-4-31b-it:free"),
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "liquid/lfm-2.5-2.6b:free"
    ]

    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LegalAId"
    }

    last_err = None
    for model in models_to_try:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": "You are a helpful Indian legal rights assistant explaining rights in simple, empathetic plain language to non-lawyers."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            }
            res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=10)
            res.raise_for_status()
            data = res.json()
            return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            last_err = e
            continue

    if last_err:
        raise last_err


def call_groq_api(prompt: str) -> str:
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        raise ValueError("GROQ_API_KEY not configured")

    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-70b-versatile",
        "messages": [
            {"role": "system", "content": "You are a helpful Indian legal rights assistant explaining rights in simple, empathetic plain language to non-lawyers."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }
    res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=8)
    res.raise_for_status()
    data = res.json()
    return data["choices"][0]["message"]["content"].strip()


def call_gemini_api(prompt: str) -> str:
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY not configured")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    res = requests.post(url, headers=headers, json=payload, timeout=8)
    res.raise_for_status()
    data = res.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def generate_plain_explanation(kb_entry: Any, facts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates a plain-language rights explanation using LLMs strictly seeded with kb_entry.plain_summary_seed.
    Applies Citation Guard & Fallback Chain: OpenRouter -> Groq -> Gemini -> KB Seed Fallback.
    """
    facts_str = ", ".join([f"{f.get('entity_type', 'fact')}: {f.get('entity_value', '')}" for f in facts]) if facts else "No extra facts provided"

    prompt = (
        f"Rephrase the following legal summary seed into 3-4 simple, warm, clear sentences for a first-generation litigant.\n\n"
        f"LEGAL SEED: {kb_entry.plain_summary_seed}\n"
        f"USER FACTS: {facts_str}\n\n"
        f"STRICT RULES:\n"
        f"1. DO NOT invent or introduce any new legal section numbers, act names, or court names.\n"
        f"2. Keep language empathetic, clear, and easy to understand.\n"
        f"3. Explain what rights the user has and what immediate step they can take."
    )

    explanation = None
    provider_used = "seed_fallback"
    guard_passed = True

    # 1. Try OpenRouter
    try:
        raw_output = call_openrouter_api(prompt)
        if verify_citation_guard(raw_output, kb_entry.section_number, kb_entry.act_name):
            explanation = raw_output
            provider_used = "openrouter_free"
        else:
            print("[LLM GUARD] OpenRouter response failed citation check. Retrying with Groq...")
    except Exception as e:
        print(f"[LLM] OpenRouter API failed: {e}")

    # 2. Try Groq
    if not explanation:
        try:
            raw_output = call_groq_api(prompt)
            if verify_citation_guard(raw_output, kb_entry.section_number, kb_entry.act_name):
                explanation = raw_output
                provider_used = "groq"
            else:
                print("[LLM GUARD] Groq response failed citation check. Retrying with Gemini...")
        except Exception as e:
            print(f"[LLM] Groq API unavailable: {e}")

    # 3. Try Gemini
    if not explanation:
        try:
            raw_output = call_gemini_api(prompt)
            if verify_citation_guard(raw_output, kb_entry.section_number, kb_entry.act_name):
                explanation = raw_output
                provider_used = "gemini"
            else:
                print("[LLM GUARD] Gemini response failed citation check.")
        except Exception as e:
            print(f"[LLM] Gemini API unavailable: {e}")

    # 4. Fallback to unmodified seed text if explanation is empty or invalid
    if not explanation or not explanation.strip():
        explanation = kb_entry.plain_summary_seed
        provider_used = "unmodified_kb_seed"
        guard_passed = True

    return {
        "explanation": explanation,
        "provider_used": provider_used,
        "guard_passed": guard_passed,
        "kb_summary_seed": kb_entry.plain_summary_seed
    }
