import spacy
from langdetect import detect, DetectorFactory
import re
import logging
from typing import List, Dict, Any

# Ensure consistent language detection
DetectorFactory.seed = 0

logger = logging.getLogger(__name__)

# Load spaCy model (we'll fall back to empty model if not available, but should be installed)
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    logger.warning("spacy en_core_web_sm not found. Run 'python -m spacy download en_core_web_sm'")
    # Fallback blank english model for testing if download failed
    import spacy.blank
    nlp = spacy.blank("en")


def detect_language(text: str) -> str:
    """Detect the language of the provided text."""
    try:
        lang = detect(text)
        return lang
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        return "en"


def extract_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extract entities from text using spaCy NER and custom regex.
    Returns a list of dicts: {"label": "...", "value": "..."}
    """
    extracted = []
    
    # 1. spaCy NER (Names, Organizations, Locations, Dates, Money)
    doc = nlp(text)
    allowed_labels = {"PERSON", "ORG", "GPE", "DATE", "MONEY"}
    
    for ent in doc.ents:
        if ent.label_ in allowed_labels:
            extracted.append({
                "label": ent.label_,
                "value": ent.text.strip()
            })
            
    # 2. Custom Regex rules for specific legal artifacts
    # Amount specific (e.g., Rs. 5000, 50,000 INR)
    rs_pattern = r"(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{2})?"
    for match in re.finditer(rs_pattern, text, re.IGNORECASE):
        # Only add if not heavily overlapping with spaCy MONEY
        val = match.group(0)
        if not any(val in e["value"] for e in extracted if e["label"] == "MONEY"):
            extracted.append({
                "label": "AMOUNT",
                "value": val
            })
            
    # Phone numbers (Indian format as example)
    phone_pattern = r"(?:\+91|0)?\s*[6-9]\d{9}"
    for match in re.finditer(phone_pattern, text):
        extracted.append({
            "label": "PHONE_NUMBER",
            "value": match.group(0).strip()
        })
        
    # Deduplicate extracted entities
    seen = set()
    unique_entities = []
    for e in extracted:
        identifier = f"{e['label']}::{e['value']}"
        if identifier not in seen:
            seen.add(identifier)
            unique_entities.append(e)
            
    return unique_entities
