# lms_app/cert_templates/minimalist.py
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, A4

def draw_minimalist(c, data):
    """
    เทมเพต Minimalist: แถบสีด้านซ้าย + heading ด้านบน + ชื่อผู้เรียนใน [ ]
    ใช้ field:
      - student_name
      - course_name
      - instructor_name
      - completion_date
      - primary_color
      - secondary_color
    """
    width, height = landscape(A4)

    primary = HexColor(data.get("primary_color", "#00bcd4"))
    secondary = HexColor(data.get("secondary_color", "#475569"))

    # ===== พื้นหลัง =====
    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # ===== แถบซ้าย =====
    BAND_WIDTH = 65
    c.setFillColor(primary)
    c.rect(0, 0, BAND_WIDTH, height, fill=1, stroke=0)

    # ===== แถบล่าง (ที่ขาดอยู่) =====
    BOTTOM_BAR_HEIGHT = 18
    c.setFillColor(primary)
    c.rect(0, 0, width, BOTTOM_BAR_HEIGHT, fill=1, stroke=0)

    # ===== พื้นที่เนื้อหา =====
    LEFT = BAND_WIDTH + 40  # margin จากขอบซ้ายหลังแถบ
    TOP  = height - 80

    # ---- บรรทัดบนสุด: ชื่อคอร์ส ----
    course_title = data.get("course_name", "")
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 26)
    c.drawString(LEFT, TOP, course_title)

    # ---- ใบประกาศนียบัตร ----
    c.setFillColor(secondary)
    c.setFont("Sarabun-Bold", 22)
    c.drawString(LEFT, TOP - 35, "ใบประกาศนียบัตร")

    # ---- มอบให้ไว้เพื่อแสดงว่า ----
    c.setFont("Sarabun", 18)
    c.drawString(LEFT, TOP - 90, "มอบให้ไว้เพื่อแสดงว่า")

    # ---- ชื่อผู้เรียนในวงเล็บ [ ] ----
    student = data.get("student_name", "")
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 32)
    c.drawString(LEFT, TOP - 130, f"[{student}]")

    # ---- ข้อความใต้ชื่อ ----
    c.setFillColor(secondary)
    c.setFont("Sarabun", 18)
    c.drawString(LEFT, TOP - 170, "ได้สำเร็จการศึกษาตามหลักสูตรเป็นที่เรียบร้อย")

    # ---- แถวคอร์สซ้ำด้านล่าง (เช่น 'ทดสอบบบ') ----
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 20)
    c.drawString(LEFT, TOP - 210, course_title)

    # ===== footer: ผู้สอน & วันที่ =====
    FOOTER_Y = 90

    # ผู้สอน (ซ้ายล่าง)
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 18)
    c.drawString(LEFT, FOOTER_Y + 25, data.get("instructor_name", ""))

    c.setStrokeColor(primary)
    c.setLineWidth(2)
    SIGN_LINE_WIDTH = 160
    c.line(LEFT, FOOTER_Y + 15, LEFT + SIGN_LINE_WIDTH, FOOTER_Y + 15)

    c.setFillColor(secondary)
    c.setFont("Sarabun", 14)
    c.drawString(LEFT, FOOTER_Y - 5, "อาจารย์ผู้สอน")

    # วันที่สำเร็จ (ขวาล่าง)
    right_block_x = width - 260

    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 18)
    c.drawString(right_block_x, FOOTER_Y + 25, "[วันที่สำเร็จการศึกษา]")

    c.setStrokeColor(primary)
    c.setLineWidth(2)
    c.line(right_block_x, FOOTER_Y + 15, right_block_x + SIGN_LINE_WIDTH, FOOTER_Y + 15)

    c.setFillColor(secondary)
    c.setFont("Sarabun", 14)
    c.drawString(right_block_x, FOOTER_Y - 5, "วันที่สำเร็จการศึกษา")

    # ข้อความวันที่จริง (เล็ก ๆ ใต้บรรทัด)
    c.setFont("Sarabun", 12)
    c.drawString(right_block_x, FOOTER_Y - 22, data.get("completion_date", ""))
