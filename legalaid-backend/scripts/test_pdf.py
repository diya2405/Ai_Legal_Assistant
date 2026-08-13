import io
from xhtml2pdf import pisa

def test_xhtml2pdf():
    html_content = """
    <html>
    <head>
        <style>
            body { font-family: Helvetica, sans-serif; padding: 20px; }
            h1 { color: #1a365d; border-bottom: 2px solid #2b6cb0; }
            p { font-size: 12pt; line-height: 1.5; }
        </style>
    </head>
    <body>
        <h1>LEGAL NOTICE</h1>
        <p>This is a formal legal demand notice under the Consumer Protection Act, 2019.</p>
    </body>
    </html>
    """
    
    result = io.BytesIO()
    pdf = pisa.pisaDocument(io.StringIO(html_content), result)
    if not pdf.err:
        pdf_data = result.getvalue()
        print(f"PDF generated successfully! Size: {len(pdf_data)} bytes")
        return True
    else:
        print(f"PDF generation error: {pdf.err}")
        return False

if __name__ == "__main__":
    test_xhtml2pdf()
