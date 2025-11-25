from io import BytesIO
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from .base import TEMPLATE_FILE, CSS_FILE, get_base_url
from reportlab.lib import colors

def render_certificate_pdf(context: dict, out_path: str | None = None) -> bytes:
    """
    สร้าง PDF จาก template + context
    - ถ้าให้ out_path -> เขียนไฟล์ลงดิสก์ แล้ว return เนื้อไฟล์ (bytes)
    - ถ้าไม่ให้ -> return เป็น bytes อย่างเดียว
    """
    html = render_to_string(str(TEMPLATE_FILE), context)
    base_url = get_base_url()
    pdf_io = BytesIO()
    HTML(string=html, base_url=base_url).write_pdf(
        pdf_io,
        stylesheets=[CSS(filename=str(CSS_FILE))],
    )
    data = pdf_io.getvalue()
    if out_path:
        with open(out_path, "wb") as f:
            f.write(data)
    return data
