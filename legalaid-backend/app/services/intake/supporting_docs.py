from typing import List, Dict, Any

def generate_case_supporting_docs(raw_text: str, matched_kb: List[Dict[str, Any]]) -> List[str]:
    """
    Generates dynamic, case-specific supporting documents checklist
    based on the grievance text and matched legal domains.
    """
    text_lower = raw_text.lower()
    domains = [kb.get("domain", "").lower() for kb in matched_kb]

    docs = []

    # 1. Consumer Dispute (Goods / Refurbished / Defective / Refund)
    if "consumer" in domains or any(w in text_lower for w in ["defective", "refund", "laptop", "fridge", "phone", "seller", "vendor", "warranty", "store", "electronics"]):
        docs.extend([
            "Tax Invoice / Retail Cash Memo / Purchase Bill",
            "Payment Proof (Bank Statement, Credit Card Statement, or UPI Ref ID)",
            "Warranty Card / Service Center Job Sheet & Repair Denial Report",
            "Email & WhatsApp Written Complaints sent to Vendor / Brand Manager"
        ])

    # 2. Labor & Employment Dispute (Salary / Termination / Bonus)
    elif "labor" in domains or "employment" in domains or any(w in text_lower for w in ["salary", "employer", "company", "wage", "boss", "termination", "job", "office"]):
        docs.extend([
            "Employment Offer Letter / Appointment Contract",
            "Monthly Salary Slips for the disputed working period",
            "Bank Account Statement highlighting unpaid salary months",
            "Resignation Letter / Termination Email / HR Chat Transcripts"
        ])

    # 3. Tenant Rights (Deposit / Rent / Eviction)
    elif "tenant" in domains or "rent" in domains or any(w in text_lower for w in ["landlord", "deposit", "flat", "rent", "tenant", "lease", "house"]):
        docs.extend([
            "Registered Rent Agreement / Lease Deed",
            "Bank Transfer Proof of Initial Security Deposit Payment",
            "Monthly Rent Payment Receipts or Online Transfer Screenshots",
            "Vacating Notice / Flat Condition Photos & Handover Confirmation"
        ])

    # 4. Default Fallback
    else:
        docs.extend([
            "Original Agreement / Bill / Work Order",
            "Bank Payment Proof / Transaction Receipt",
            "Written Communications (Emails, Letters, or Messages)",
            "Identity Proof (Aadhaar / PAN Card)"
        ])

    return docs
