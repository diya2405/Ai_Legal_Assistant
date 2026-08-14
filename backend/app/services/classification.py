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

KEYWORD_RULES = [
    (r'(cyber|phishing|otp|upi fraud|online fraud|hacked|cybercrime|fake website|bank fraud|साइबर|यूपीआई|क्यूआर|धोखाधड़ी|फर्जी|गूगल पे)', 'cybercrime', 'online_financial_phishing'),
    (r'(threat|threaten|harm|hurt|kill|assault|attack|police complaint|fir|bns|extortion|धमकी|पुलिस|एफआईआर|मारपीट|रंगदारी)', 'criminal', 'physical_threat_harassment'),
    (r'(evict|eviction|locked out|forced me out|forced out|dispossess|lockout|खाली करा|बेदखल|ताला लगा)', 'tenant', 'illegal_eviction'),
    (r'(deposit|security deposit|refund deposit|withholding deposit|सिक्योरिटी डिपॉजिट|डिपॉजिट|अमानत राशि|किराया जमा)', 'tenant', 'deposit_not_returned'),
    (r'(landlord|tenant|rented|flat owner|house owner|मकान मालिक|किराएदार|फ्लैट मालिक|किराया)', 'tenant', 'deposit_not_returned'),
    (r'(salary|wages|employer|employee|resigned|unpaid|fnf|termination|job dues|workplace|सैलरी|वेतन|बकाया|बर्खास्तगी|नौकरी|मालिक|कर्मचारी)', 'labour', 'unpaid_salary'),
    (r'(mrp|charging higher|overcharge|cash memo|fake invoice|एमआरपी|ओवरचार्ज|अधिक दाम|रसीद|पक्का बिल)', 'consumer', 'unfair_trade_practice'),
    (r'(bought|purchased|defective|seller|supermarket|laptop|product|refund|washing machine|दुकानदार|खराब|वारंटी|रिफंड|बदलने|उत्पाद)', 'consumer', 'defective_product'),
    (r'(rera|builder|flat possession|possession delay|बिल्डर|रेरा|फ्लैट|कब्जा|देरी)', 'property', 'builder_delay'),
    (r'(insurance|claim|policy|hospitalization|cashless|बीमा|क्लेम|पॉलिसी|अस्पताल|खारिज)', 'consumer', 'insurance_rejection'),
    (r'(utility|electricity|water supply|cut off|connection|बिजली|पानी|सप्लाई|कनेक्शन|काट)', 'tenant', 'utility_disconnection'),
    (r'(medical|doctor|hospital|surgical|negligence|चिकित्सा|डॉक्टर|अस्पताल|लापरवाही|सर्जरी)', 'medical', 'medical_negligence'),
    (r'(cheque|bounce|sec 138|ni act|चेक|बाउंस|धारा 138)', 'financial', 'cheque_bounce'),
    (r'(mact|accident|road accident|truck|surance claim|सड़क दुर्घटना|हादसा|ट्रक|मुआवजा क्लेम)', 'accident', 'mact_claim'),
    (r'(trademark|brand|counterfeit|infringement|ट्रेडमार्क|ब्रांड|लोगो|नकली)', 'intellectual_property', 'trademark_infringement'),
    (r'(cibil|credit score|loan default|harassment|सिबिल|क्रेडिट स्कोर|लोन डिफॉल्ट|बैंक)', 'financial', 'cibil_harassment')
]

def classify_intake_text(text: str) -> Dict[str, Any]:
    """
    Classifies legal intake text using ML model + rule-based domain keyword heuristics.
    Returns domain, issue_type, confidence, candidate matches, and clarification status.
    """
    text_lower = text.lower()

    # Rule-based fast check for specific domains
    rule_domain = None
    rule_issue = None
    for pattern, dom, issue in KEYWORD_RULES:
        if re.search(pattern, text_lower):
            rule_domain = dom
            rule_issue = issue
            break

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
    
    # If rule matched, boost candidate match score
    if rule_domain and rule_issue:
        found_rule_match = False
        for cand in candidate_matches:
            if cand["domain"] in (rule_domain, "labor", "labour"):
                cand["score"] = max(cand["score"], 0.95)
                if cand["issue_type"] == rule_issue:
                    cand["score"] = 0.98
                    found_rule_match = True
        if not found_rule_match:
            candidate_matches.insert(0, {
                "domain": rule_domain,
                "issue_type": rule_issue,
                "score": 0.98
            })

    # Re-sort candidate matches by score
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
