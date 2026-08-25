from PyPDF2 import PdfReader


def extract_text_from_pdf(file_path):
    try:
        reader = PdfReader(file_path)

        text = ""

        for page in reader.pages:
            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        return text.strip()

    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""