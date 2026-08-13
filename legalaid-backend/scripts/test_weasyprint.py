import weasyprint

def test_weasy():
    try:
        html = weasyprint.HTML(string="<h1>Test Legal Notice</h1><p>This is a test PDF.</p>")
        pdf_bytes = html.write_pdf()
        print(f"WeasyPrint generated PDF successfully: {len(pdf_bytes)} bytes")
        return True
    except Exception as e:
        print(f"WeasyPrint error: {e}")
        return False

if __name__ == "__main__":
    test_weasy()
