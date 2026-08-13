import os
import io
import uuid
import logging
from datetime import date
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "templates")
STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "documents")

# Ensure storage directory exists
os.makedirs(STORAGE_DIR, exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))


def generate_legal_notice_pdf(
    doc_id: uuid.UUID,
    intake_raw_text: str,
    tone: str,
    complainant_name: str,
    complainant_address: str,
    opponent_name: str,
    opponent_address: str,
    amount_claimed: str,
    citations: list,
    remedy_forum: str,
    limitation_period: str
) -> str:
    """
    Renders HTML legal notice via Jinja2 and compiles to PDF using xhtml2pdf.
    Saves PDF file in storage/documents/{doc_id}.pdf and returns the absolute storage path.
    """
    logger.info(f"Generating PDF document: {doc_id} (tone={tone})")
    
    template = jinja_env.get_template("legal_notice.html")
    
    context = {
        "date_today": date.today().strftime("%B %d, %Y"),
        "tone": tone.lower(),
        "complainant_name": complainant_name or "Complainant",
        "complainant_address": complainant_address or "Not Provided",
        "opponent_name": opponent_name or "Opposing Party / Vendor",
        "opponent_address": opponent_address or "Not Provided",
        "intake_raw_text": intake_raw_text,
        "amount_claimed": amount_claimed,
        "citations": citations,
        "remedy_forum": remedy_forum,
        "limitation_period": limitation_period,
    }
    
    rendered_html = template.render(context)
    
    file_path = os.path.join(STORAGE_DIR, f"{doc_id}.pdf")
    
    with open(file_path, "wb") as pdf_file:
        pisa_status = pisa.pisaDocument(io.StringIO(rendered_html), pdf_file)
        
    if pisa_status.err:
        logger.error(f"PDF rendering error for document {doc_id}: {pisa_status.err}")
        raise RuntimeError("Failed to generate PDF document.")

    logger.info(f"PDF successfully generated at: {file_path}")
    return file_path
