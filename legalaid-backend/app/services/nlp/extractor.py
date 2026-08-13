import spacy
from langdetect import detect, DetectorFactory
import re
import logging
from typing import List, Dict, Any

# Ensure consistent language detection
DetectorFactory.seed = 0

logger = logging.getLogger(__name__)

# Load spaCy model with fail-safe fallback
nlp = None
try:
    nlp = spacy.load("en_core_web_sm")
    logger.info("Successfully loaded spaCy model en_core_web_sm")
except Exception as e:
    logger.warning(f"spacy en_core_web_sm not found: {e}. Initializing blank English pipeline fallback.")
    try:
        nlp = spacy.blank("en")
    except Exception as ex:
        logger.error(f"Failed to initialize blank spaCy pipeline: {ex}")
        nlp = None


def detect_language(text: str) -> str:
    """Detect the language of the provided text."""
    if not text:
        return "en"
    try:
        lang = detect(text)
        return lang
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        return "en"


def extract_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extract entities from text using spaCy NER and custom regex rules.
    Returns a list of dicts: {"label": "...", "value": "..."}
    """
    extracted = []
    if not text:
        return extracted
    
    # 1. spaCy NER (Names, Organizations, Locations, Dates, Money)
    if nlp is not None:
        try:
            doc = nlp(text)
            allowed_labels = {"PERSON", "ORG", "GPE", "DATE", "MONEY"}
            for ent in getattr(doc, "ents", []):
                if ent.label_ in allowed_labels:
                    extracted.append({
                        "label": ent.label_,
                        "value": ent.text.strip()
                    })
        except Exception as err:
            logger.error(f"spaCy entity extraction error: {err}")

    # 2. Custom Regex rules for specific legal artifacts & financial values
    rs_pattern = r"(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{2})?"
    for match in re.finditer(rs_pattern, text, re.IGNORECASE):
        val = match.group(0)
        if not any(val in e["value"] for e in extracted if e["label"] == "MONEY"):
            extracted.append({
                "label": "AMOUNT",
                "value": val
            })
            
    # Phone numbers (Indian 10-digit format)
    phone_pattern = r"(?:\+91|0)?\s*[6-9]\d{9}"
    for match in re.finditer(phone_pattern, text):
        extracted.append({
            "label": "PHONE_NUMBER",
            "value": match.group(0).strip()
        })

    # Dates (e.g. 12th May, 10/05/2026, 2026-05-10)
    date_pattern = r"\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{0,4}\b"
    for match in re.finditer(date_pattern, text, re.IGNORECASE):
        val = match.group(0)
        if not any(val in e["value"] for e in extracted if e["label"] == "DATE"):
            extracted.append({
                "label": "DATE",
                "value": val
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
