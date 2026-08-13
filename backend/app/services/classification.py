import os
import re
from typing import Dict, List, Tuple, Any
from app.ml.train_classifier import load_or_train_model, MODEL_PATH

_MODEL_PAYLOAD = None

def get_classifier_model():
    global _MODEL_PAYLOAD
    if _MODEL_PAYLOAD is None:
        _MODEL_PAYLOAD = load_or_train_model(MODEL_PATH)
    return _MODEL_PAYLOAD

def tokenize_ngram(text: str) -> set:
    text = text.lower()
    words = re.findall(r'\w+', text)
    ngrams = set(words)
    for i in range(len(text) - 2):
        ngrams.add(text[i:i+3])
    return ngrams

def jaccard_similarity(text1: str, text2: str) -> float:
    s1 = tokenize_ngram(text1)
    s2 = tokenize_ngram(text2)
    if not s1 or not s2:
        return 0.0
    return len(s1.intersection(s2)) / len(s1.union(s2))

def classify_intake_text(text: str) -> Dict[str, Any]:
    """
    Classifies legal intake text using trained Machine Learning model.
    Returns domain, issue_type, confidence, candidate matches, and clarification status.
    """
    model_data = get_classifier_model()
    pipeline = model_data["pipeline"]
    classes = list(pipeline.classes_)
    
    # Predict probabilities across classes using trained ML model
    probas = pipeline.predict_proba([text])[0]
    
    candidate_matches = []
    for cls_name, prob in zip(classes, probas):
        parts = cls_name.split(":")
        domain = parts[0]
        issue_type = parts[1] if len(parts) > 1 else "general"
        candidate_matches.append({
            "domain": domain,
            "issue_type": issue_type,
            "score": round(float(prob), 4)
        })
    
    # Keyword Rule Boost for High-Precision Legal Terms
    text_lower = text.lower()
    keyword_boosts = [
        (["mrp", "supermarket", "cash memo", "overcharg", "printed price", "soap", "soap bar", "fake item", "wrong item", "substituted", "flipkart", "amazon", "fraud", "cheating", "empty box", "different item"], "consumer", "unfair_trade_practice"),
        (["defective", "warranty", "repair", "broken product", "washing machine"], "consumer", "defective_product"),
        (["deposit", "landlord", "flat", "rent", "vacating"], "tenant", "deposit_not_returned"),
        (["evict", "water connection", "electricity", "lock out"], "tenant", "illegal_eviction"),
        (["salary", "wages", "withheld", "employer", "month"], "labor", "unpaid_wages"),
        (["terminated", "retrenched", "fired", "notice pay"], "labor", "wrongful_termination")
    ]

    for keywords, target_domain, target_issue in keyword_boosts:
        if any(kw in text_lower for kw in keywords):
            for match in candidate_matches:
                if match["domain"] == target_domain and match["issue_type"] == target_issue:
                    match["score"] = round(match["score"] + 0.35, 4)

    # Re-sort after keyword boosting
    candidate_matches.sort(key=lambda x: x["score"], reverse=True)

    top_match = candidate_matches[0]
    domain = top_match["domain"]
    issue_type = top_match["issue_type"]
    confidence = top_match["score"]
    
    # Check if confidence threshold (< 0.25) triggers clarification loop
    CONFIDENCE_THRESHOLD = 0.25
    clarification_needed = bool(confidence < CONFIDENCE_THRESHOLD)
    clarification_question = None
    
    if clarification_needed and len(candidate_matches) >= 2:
        match1 = candidate_matches[0]["issue_type"].replace("_", " ")
        match2 = candidate_matches[1]["issue_type"].replace("_", " ")
        clarification_question = (
            f"Are you seeking assistance regarding '{match1}' or '{match2}'?"
        )

    return {
        "domain": domain,
        "issue_type": issue_type,
        "confidence": confidence,
        "clarification_needed": clarification_needed,
        "clarification_question": clarification_question,
        "candidate_matches": candidate_matches
    }
