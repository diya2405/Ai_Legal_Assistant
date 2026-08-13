import re
from typing import List, Dict, Any

def extract_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extracts structured entities (dates, monetary amounts, party names, addresses) from intake text.
    Returns list of dicts: {'entity_type': ..., 'entity_value': ..., 'confirmed_by_user': False}
    """
    entities = []

    # 1. Monetary Amounts (₹ / Rs / Rupee / Lakh / Crore)
    currency_patterns = [
        r'(?:₹|rs\.?|rupees?|inr)\s*([\d,]+(?:\.\d+)?(?:\s*(?:lakh|crore|thousand|k))?)',
        r'([\d,]+(?:\.\d+)?)\s*(?:rupees?|rs|inr|₹)'
    ]
    for pattern in currency_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            val = match.group(0).strip()
            if not any(e['entity_value'] == val for e in entities):
                entities.append({
                    "entity_type": "amount",
                    "entity_value": val,
                    "confirmed_by_user": False
                })

    # 2. Dates & Durations
    date_patterns = [
        r'\b\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}\b',
        r'\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{2,4}\b',
        r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{2,4}\b',
        r'\b\d+\s+(?:days?|months?|years?)\s+(?:ago|back)\b'
    ]
    for pattern in date_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            val = match.group(0).strip()
            if not any(e['entity_value'] == val for e in entities):
                entities.append({
                    "entity_type": "date",
                    "entity_value": val,
                    "confirmed_by_user": False
                })

    # 3. Party Names & Addresses (Heuristic / spaCy if available)
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG"]:
                val = ent.text.strip()
                if len(val) > 2 and not any(e['entity_value'] == val for e in entities):
                    entities.append({
                        "entity_type": "party_name",
                        "entity_value": val,
                        "confirmed_by_user": False
                    })
            elif ent.label_ in ["GPE", "LOC", "FAC"]:
                val = ent.text.strip()
                if len(val) > 2 and not any(e['entity_value'] == val for e in entities):
                    entities.append({
                        "entity_type": "address",
                        "entity_value": val,
                        "confirmed_by_user": False
                    })
    except Exception:
        # Simple regex heuristics if spaCy model not present
        owner_match = re.search(r'(?:landlord|owner|employer|company|builder|store|seller)\s+(?:named\s+|called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', text, re.IGNORECASE)
        if owner_match:
            entities.append({
                "entity_type": "party_name",
                "entity_value": owner_match.group(1),
                "confirmed_by_user": False
            })

    return entities
