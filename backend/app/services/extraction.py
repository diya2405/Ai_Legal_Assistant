import re
from typing import List, Dict, Any, Optional

def is_valid_party_name(val: str) -> bool:
    if not val or len(val) < 2:
        return False
    val_lower = val.lower().strip()
    
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
        
    if any(t in invalid_words for t in tokens):
        return False
        
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
    owner_match = re.search(
        r'(?:landlord|owner|employer|company|builder|store|seller|respondent|opponent|accused|neighbour)\s+(?:named\s+|called\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
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

    if not found_party:
        entities.append({
            "entity_type": "party_name",
            "entity_value": "Opposing Party / Respondent",
            "confirmed_by_user": False
        })

    return entities


def extract_structured_case_object(raw_text: str, domain: str = "consumer", language: str = "en") -> Dict[str, Any]:
    """
    Constructs a complete structured legal case JSON object from natural language intake.
    Identifies missing critical fields and returns targeted follow-up questions.
    """
    entities = extract_entities(raw_text)
    
    # 1. Extract Amounts & Dates
    amounts = [e['entity_value'] for e in entities if e['entity_type'] == 'amount']
    dates = [e['entity_value'] for e in entities if e['entity_type'] == 'date']
    parties = [e['entity_value'] for e in entities if e['entity_type'] == 'party_name']
    addresses = [e['entity_value'] for e in entities if e['entity_type'] == 'address']

    primary_amount = amounts[0] if amounts else "Not specified"
    primary_date = dates[0] if dates else "Not specified"
    opponent_name = parties[0] if parties else "Opposing Party / Entity"
    location = addresses[0] if addresses else "Not specified"

    # 2. Extract Evidence items
    evidence = []
    text_lower = raw_text.lower()
    if any(w in text_lower for w in ['invoice', 'bill', 'receipt', 'mrp']):
        evidence.append({"type": "document", "description": "Order tax invoice / Cash memo receipt"})
    if any(w in text_lower for w in ['photo', 'video', 'image', 'picture', 'screen']):
        evidence.append({"type": "media", "description": "Photos / Video proof of defect or damage"})
    if any(w in text_lower for w in ['email', 'mail', 'chat', 'whatsapp', 'message']):
        evidence.append({"type": "communication", "description": "Customer care rejection emails / chat logs"})

    if not evidence:
        evidence.append({"type": "general", "description": "Written complaint record & communications"})

    # 3. Identify Missing Critical Info & Follow-Up Questions
    missing_info = []

    if domain == "tenant":
        if primary_amount == "Not specified":
            missing_info.append({"field": "deposit_amount", "question": "How much security deposit amount was paid to the landlord?"})
        if location == "Not specified":
            missing_info.append({"field": "property_state", "question": "Which state and city is the rented property located in?"})
        if not any(w in text_lower for w in ['agreement', 'rent agreement', 'lease']):
            missing_info.append({"field": "agreement_status", "question": "Do you have a written, registered rental agreement with the landlord?"})
    elif domain == "labour":
        if primary_amount == "Not specified":
            missing_info.append({"field": "unpaid_salary", "question": "What is the total unpaid salary / employment dues amount?"})
        if opponent_name == "Opposing Party / Entity":
            missing_info.append({"field": "employer_name", "question": "What is the official registered name of your employer/company?"})
    elif domain == "consumer":
        if primary_amount == "Not specified":
            missing_info.append({"field": "purchase_amount", "question": "What was the total purchase price paid for the item/service?"})
        if opponent_name == "Opposing Party / Entity":
            missing_info.append({"field": "seller_name", "question": "What is the name of the retail store or e-commerce platform?"})
    elif domain == "criminal":
        if opponent_name == "Opposing Party / Entity":
            missing_info.append({"field": "accused_identity", "question": "Who is the accused person or party making threats against you?"})
        if primary_date == "Not specified":
            missing_info.append({"field": "incident_date", "question": "On what date and time did the threatening incident occur?"})
    elif domain == "cybercrime":
        if primary_amount == "Not specified":
            missing_info.append({"field": "fraud_amount", "question": "How much total money was lost or fraudulently transferred?"})

    structured_case = {
        "user": {
            "name": "First Citizen / Litigant",
            "address": location if location != "Not specified" else "Resident Address",
            "phone": "Not provided",
            "email": "Not provided"
        },
        "opponent": {
            "name": opponent_name,
            "organization": opponent_name,
            "address": location if location != "Not specified" else "Opposing Party Address"
        },
        "case": {
            "domain": domain,
            "dispute_type": "legal_dispute",
            "summary": raw_text[:300] + ("..." if len(raw_text) > 300 else ""),
            "facts": [raw_text]
        },
        "dates": [
            {"description": "Incident / Cause of action date", "date": primary_date}
        ],
        "financials": [
            {"description": "Disputed monetary value", "amount": primary_amount, "currency": "INR"}
        ],
        "jurisdiction": {
            "country": "India",
            "state": "Applicable State Jurisdiction",
            "district": "Local Judicial District",
            "city": location if location != "Not specified" else "Local City"
        },
        "evidence": evidence,
        "requested_relief": ["Full refund / resolution", "Statutory compensation for mental hardship"],
        "missing_critical_info": missing_info
    }

    return structured_case
