import re
from typing import List, Dict, Any

def is_valid_party_name(val: str) -> bool:
    if not val or len(val) < 2:
        return False
    val_lower = val.lower().strip()
    
    # Common verb/stop phrases to reject
    invalid_words = {
        "is", "are", "was", "were", "be", "been", "being",
        "refuse", "refused", "refusing", "refuses",
        "deny", "denied", "denying", "denies",
        "fail", "failed", "failing", "fails",
        "pay", "paid", "paying", "pays",
        "return", "returned", "returning", "returns",
        "give", "gave", "giving", "gives",
        "take", "took", "taking", "takes",
        "not", "no", "did", "does", "has", "have", "had"
    }
    
    tokens = re.findall(r'\w+', val_lower)
    if not tokens:
        return False
        
    # Reject if any token is a prohibited action verb
    if any(t in invalid_words for t in tokens):
        return False
        
    # Reject generic pronoun/stop phrases
    if val_lower in {"he", "she", "they", "it", "this", "that", "someone", "my", "your", "his", "her"}:
        return False

    return True


def extract_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extracts structured entities (dates, monetary amounts, party names, addresses) from intake text.
    Filters out invalid verb phrases and provides clean defaults.
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

    # 3. Party Names & Addresses
    found_party = False
    
    # Explicit pattern matching for owner/landlord/employer/builder/company names
    owner_match = re.search(
        r'(?:landlord|owner|employer|company|builder|store|seller|respondent|opponent|accused)\s+(?:named\s+|called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        text, re.IGNORECASE
    )
    if owner_match and is_valid_party_name(owner_match.group(1)):
        val = owner_match.group(1).strip()
        entities.append({
            "entity_type": "party_name",
            "entity_value": val,
            "confirmed_by_user": False
        })
        found_party = True

    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ in ["PERSON", "ORG"]:
                val = ent.text.strip()
                if is_valid_party_name(val) and not any(e['entity_value'] == val for e in entities):
                    entities.append({
                        "entity_type": "party_name",
                        "entity_value": val,
                        "confirmed_by_user": False
                    })
                    found_party = True
            elif ent.label_ in ["GPE", "LOC", "FAC"]:
                val = ent.text.strip()
                if len(val) > 2 and not any(e['entity_value'] == val for e in entities):
                    entities.append({
                        "entity_type": "address",
                        "entity_value": val,
                        "confirmed_by_user": False
                    })
    except Exception:
        pass

    # Fallback to clean default if no explicit proper name was mentioned
    if not found_party:
        entities.append({
            "entity_type": "party_name",
            "entity_value": "Opposing Party / Respondent",
            "confirmed_by_user": False
        })

    return entities
