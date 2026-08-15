import os
from typing import Dict, List, Any
from app.ml.train_classifier import load_or_train_model, MODEL_PATH

_MODEL_PAYLOAD = None

def get_classifier_model():
    global _MODEL_PAYLOAD
    if _MODEL_PAYLOAD is None:
        _MODEL_PAYLOAD = load_or_train_model(MODEL_PATH)
    return _MODEL_PAYLOAD


def classify_intake_text(text: str) -> Dict[str, Any]:
    """
    Pure Machine Learning classifier for legal intake text using trained Scikit-Learn TF-IDF + Logistic Regression.
    No hardcoded rules, no regex heuristics, no keyword overrides.
    Returns dynamic domain, issue_type, probability confidence, and candidate matches.
    """
    model_data = get_classifier_model()
    pipeline = model_data["pipeline"]
    classes = list(pipeline.classes_)
    
    # 1. Compute exact probability distribution using trained ML model
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
    
    # 2. Sort candidate matches strictly by ML model probability in descending order
    candidate_matches.sort(key=lambda x: x["score"], reverse=True)

    top_match = candidate_matches[0]
    domain = top_match["domain"]
    issue_type = top_match["issue_type"]
    confidence = top_match["score"]
    
    # 3. Dynamic clarification assessment based on confidence gap
    CONFIDENCE_THRESHOLD = 0.20
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
