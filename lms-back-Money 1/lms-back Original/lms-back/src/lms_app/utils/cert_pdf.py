import requests
from django.core.files.base import ContentFile
from django.conf import settings

def fetch_pdf_from_next(cert_id: str) -> bytes:
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
    token = getattr(settings, "CERT_RENDER_TOKEN", "")
    url = f"{base}/api/render-cert?certId={cert_id}&token={token}"
    r = requests.get(url, timeout=90)
    r.raise_for_status()
    return r.content

def render_and_attach_pdf(cert):
    pdf_bytes = fetch_pdf_from_next(str(cert.id))
    cert.file.save(f"{cert.id}.pdf", ContentFile(pdf_bytes), save=True)
