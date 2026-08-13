"""NLP package for language detection and entity extraction."""
from app.services.nlp.extractor import detect_language, extract_entities
from app.services.nlp.classifier import find_best_matches

__all__ = ["detect_language", "extract_entities", "find_best_matches"]
