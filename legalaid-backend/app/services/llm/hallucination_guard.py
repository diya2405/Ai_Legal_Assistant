import re
import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)


def guard_hallucinations(
    explanation_text: str,
    allowed_kb_entries: List[Dict[str, Any]]
) -> Tuple[str, bool, List[Dict[str, str]]]:
    """
    Regex-based hallucination guard for legal explanations.
    
    Ensures that any legal section or act number cited in the LLM explanation
    was explicitly present in the provided Knowledge Base context.
    
    Returns:
        (sanitized_text, has_hallucination_been_guarded, valid_citations_list)
    """
    if not allowed_kb_entries:
        # If no KB entries were allowed, strip any section citations
        pattern = r"\b(Section|sec\.|Sec\.|u/s)\s*\d+[A-Za-z]?\b"
        cleaned_text = re.sub(pattern, "[Citation Removed]", explanation_text, flags=re.IGNORECASE)
        return cleaned_text, True, []

    # 1. Build Whitelist of Allowed Sections and Acts
    allowed_sections = set()
    allowed_acts = set()
    valid_citations = []

    for kb in allowed_kb_entries:
        sec = str(kb.get("section_number", "")).strip()
        act = str(kb.get("act_name", "")).strip()
        law_code = str(kb.get("law_code", "N/A")).strip()
        
        if sec:
            allowed_sections.add(sec.lower())
            # Normalize digits (e.g. '35' from 'Section 35')
            digits_match = re.findall(r"\d+", sec)
            for d in digits_match:
                allowed_sections.add(d)
                
        if act:
            allowed_acts.add(act.lower())

        valid_citations.append({
            "act_name": act,
            "section_number": sec,
            "law_code": law_code,
            "source_url": kb.get("source_url", "")
        })

    # 2. Find all Section Citations in Explanation
    # Matches patterns like "Section 35", "sec. 12", "Section 18(1)"
    section_pattern = r"\b(Section|sec\.|Sec\.|u/s)\s*(\d+[A-Za-z]?(\(\d+\))?)\b"
    matches = list(re.finditer(section_pattern, explanation_text, flags=re.IGNORECASE))

    sanitized_text = explanation_text
    hallucination_found = False

    for match in reversed(matches):
        full_citation = match.group(0)
        num_part = match.group(2).lower()
        base_num = re.findall(r"\d+", num_part)
        
        # Check if the section number is in allowed_sections
        is_valid = False
        if num_part in allowed_sections:
            is_valid = True
        elif base_num and any(b in allowed_sections for b in base_num):
            is_valid = True

        if not is_valid:
            logger.warning(
                f"Hallucination Guard Triggered: Removed ungrounded citation '{full_citation}'"
            )
            start, end = match.span()
            sanitized_text = (
                sanitized_text[:start] +
                "[Unverified Legal Citation Removed]" +
                sanitized_text[end:]
            )
            hallucination_found = True

    return sanitized_text, hallucination_found, valid_citations
