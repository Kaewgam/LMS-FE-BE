from pathlib import Path
from django.conf import settings

BASE_DIR = Path(__file__).resolve().parent.parent  # -> lms_app/
TEMPLATE_FILE = BASE_DIR / "templates" / "certificates" / "certificate.html"
CSS_FILE = BASE_DIR / "static" / "css" / "certificate.css"
FONTS_DIR = BASE_DIR / "fonts"

def get_base_url():
    """
    base_url ที่ส่งให้ WeasyPrint ใช้แก้ path ของภาพ/ CSS / font ใน template
    """
    # ให้ชี้ไปที่โฟลเดอร์ app (ซึ่งมี templates, static, fonts อยู่)
    return str(BASE_DIR)

def absolute_media_path(relpath: str) -> str:
    """
    แปลง relative path -> absolute ใน MEDIA_ROOT (กันเคสที่ views ส่ง rel path มา)
    """
    root = Path(getattr(settings, "MEDIA_ROOT", BASE_DIR / "media"))
    return str(root / relpath)
