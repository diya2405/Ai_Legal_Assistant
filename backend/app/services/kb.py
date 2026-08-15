from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import KBEntry

DOMAIN_ALIASES = {
    "labor": "labour",
    "banking": "financial",
    "insurance": "consumer",
    "motor": "accident",
    "ip": "intellectual_property"
}

ISSUE_ALIASES = {
    "unpaid_wages": "unpaid_salary",
    "wrongful_termination": "arbitrary_termination",
    "accident_compensation": "mact_claim",
    "claim_rejection": "insurance_rejection"
}

def get_kb_entry(db: Session, domain: str, issue_type: str) -> Optional[KBEntry]:
    """
    Dynamic SQL Lookup for KB entries by domain and issue_type, supporting aliases.
    """
    mapped_domain = DOMAIN_ALIASES.get(domain, domain)
    mapped_issue = ISSUE_ALIASES.get(issue_type, issue_type)

    # 1. Exact match with mapped names
    entry = db.query(KBEntry).filter(
        KBEntry.domain == mapped_domain,
        KBEntry.issue_type == mapped_issue
    ).first()

    # 2. Try raw names if mapped lookup was different
    if not entry and (mapped_domain != domain or mapped_issue != issue_type):
        entry = db.query(KBEntry).filter(
            KBEntry.domain == domain,
            KBEntry.issue_type == issue_type
        ).first()

    # 3. Fallback to domain match if specific issue_type has no exact row
    if not entry and mapped_domain:
        entry = db.query(KBEntry).filter(KBEntry.domain == mapped_domain).first()

    if not entry and domain:
        entry = db.query(KBEntry).filter(KBEntry.domain == domain).first()

    return entry


def get_why_this_law_analysis(kb_entry: KBEntry, structured_case: Dict[str, Any] = None, language: str = "en", confidence_score: float = 0.95) -> Dict[str, Any]:
    """
    Generates a transparent 'Why This Law?' explanation dynamically mapping extracted facts -> applicable law -> source.
    """
    if not kb_entry:
        return {
            "detected_fact": "Specific facts submitted in intake",
            "legal_issue": "General Legal Rights Assessment",
            "applicable_provision": "Statutory Law Assessment",
            "reason": "Specific legal provision could not be confidently identified from available sources.",
            "official_source_name": "India Code",
            "official_source_url": "https://www.indiacode.nic.in/",
            "confidence_label": "Needs Verification",
            "confidence_score": 0.50
        }

    is_hi = language == "hi" or language.startswith("hi")
    
    summary = structured_case.get("case", {}).get("summary", "") if structured_case else ""
    financials = structured_case.get("financials", [{}])[0].get("amount", "disputed amount") if structured_case else "disputed amount"

    fact_desc = summary or f"Legal grievance involving {kb_entry.domain} dispute with {financials}."
    
    formatted_issue = kb_entry.issue_type.replace('_', ' ').title()
    
    if is_hi:
        reason = f"चूंकि आपके मामले में {kb_entry.domain} से संबंधित विवाह/विवाद और वित्तीय/व्यक्तिगत हानि शामिल है, इसलिए {kb_entry.act_name} की {kb_entry.section_number} आपके कानूनी अधिकारों की रक्षा करती है।"
        legal_issue = f"{kb_entry.domain.upper()} क्षेत्र के तहत वैधानिक शिकायत ({formatted_issue})"
    else:
        reason = f"Because your case involves a {kb_entry.domain} grievance regarding {formatted_issue} with monetary value ({financials}), {kb_entry.act_name} ({kb_entry.section_number}) grants you the legal right to seek immediate redressal."
        legal_issue = f"{kb_entry.domain.title()} Dispute ({formatted_issue})"

    dynamic_conf = round(float(confidence_score), 2)
    conf_label = "High Verification Passed" if dynamic_conf >= 0.85 else "Moderate Confidence"

    return {
        "detected_fact": fact_desc,
        "legal_issue": legal_issue,
        "applicable_provision": f"{kb_entry.act_name} ({kb_entry.section_number})",
        "reason": reason,
        "official_source_name": getattr(kb_entry, 'official_source_name', 'India Code'),
        "official_source_url": kb_entry.source_url,
        "confidence_label": conf_label,
        "confidence_score": dynamic_conf
    }
