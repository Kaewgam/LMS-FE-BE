from io import BytesIO
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from .base import TEMPLATE_FILE, CSS_FILE, get_base_url

def render_certificate_image(context: dict, out_path: str | None = None, dpi: int = 300) -> bytes:
    """
    สร้าง PNG จาก template + context ด้วย WeasyPrint (ถ้าเวอร์ชันรองรับ write_png)
    - ถ้าให้ out_path -> เขียนไฟล์ แล้ว return bytes
    - ถ้าไม่ให้ -> return bytes
    หมายเหตุ: ต้องใช้ weasyprint เวอร์ชันที่มี .write_png() (>= 53)
    """
    html = render_to_string(str(TEMPLATE_FILE), context)
    base_url = get_base_url()
    png_io = BytesIO()
    # WeasyPrint รุ่นใหม่รองรับ write_png โดยตรง
    HTML(string=html, base_url=base_url).write_png(
        png_io,
        stylesheets=[CSS(filename=str(CSS_FILE))],
        resolution=dpi,
    )
    data = png_io.getvalue()
    if out_path:
        with open(out_path, "wb") as f:
            f.write(data)
    return data
