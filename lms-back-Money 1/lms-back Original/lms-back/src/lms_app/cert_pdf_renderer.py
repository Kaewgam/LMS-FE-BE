# lms_app/cert_pdf_renderer.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.core.files.base import ContentFile
from io import BytesIO
from pathlib import Path

from .cert_templates.classic import draw_classic
from .cert_templates.minimalist import draw_minimalist
from .cert_templates.modern import draw_modern

# ----- register Thai fonts (best-effort) -----
def register_fonts():
    base = Path(__file__).resolve().parent / "fonts"
    try:
        pdfmetrics.registerFont(TTFont("Sarabun",            str(base / "THSarabunNew.ttf")))
        pdfmetrics.registerFont(TTFont("Sarabun-Bold",       str(base / "THSarabunNew Bold.ttf")))
        pdfmetrics.registerFont(TTFont("Sarabun-Italic",     str(base / "THSarabunNew Italic.ttf")))
        pdfmetrics.registerFont(TTFont("Sarabun-BoldItalic", str(base / "THSarabunNew BoldItalic.ttf")))
    except Exception:
        # หาไม่เจอให้ fallback เป็น Helvetica
        pass


def render_certificate_pdf(data: dict, filename: str):
    register_fonts()

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    style = data.get("style", "classic")

    if style == "minimalist":
        draw_minimalist(c, data)
    elif style == "modern":
        draw_modern(c, data)
    else:
        # default = classic
        draw_classic(c, data)

    c.showPage()
    c.save()

    buf.seek(0)
    return ContentFile(buf.getvalue(), name=filename)
