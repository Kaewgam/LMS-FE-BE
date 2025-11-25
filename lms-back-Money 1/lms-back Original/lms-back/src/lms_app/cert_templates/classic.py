# lms_app/cert_templates/classic.py
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor


def draw_classic(c, data: dict):
    """
    เทมเพต Classic: กรอบ 2 ชั้น กลางกระดาษ
    ใช้ field:
      - student_name
      - course_name
      - instructor_name
      - completion_date
      - primary_color
      - secondary_color
    """
    # ใช้ขนาดจาก A4 แนวนอน
    width, height = landscape(A4)

    # ดึงสีแบบกันพลาด (ไม่มี key ก็มีค่า default)
    primary = HexColor(data.get("primary_color", "#881337"))
    secondary = HexColor(data.get("secondary_color", "#1f2937"))

    # ===== กรอบ 2 ชั้น =====
    OUTER_MARGIN = 40
    OUTER_WIDTH = 6
    INNER_MARGIN = OUTER_MARGIN + 14
    INNER_WIDTH = 3

    # กรอบนอก
    c.setStrokeColor(primary)
    c.setLineWidth(OUTER_WIDTH)
    c.rect(
        OUTER_MARGIN,
        OUTER_MARGIN,
        width - 2 * OUTER_MARGIN,
        height - 2 * OUTER_MARGIN,
    )

    # กรอบใน
    c.setLineWidth(INNER_WIDTH)
    c.rect(
        INNER_MARGIN,
        INNER_MARGIN,
        width - 2 * INNER_MARGIN,
        height - 2 * INNER_MARGIN,
    )

    # ===== Title / หัวใบประกาศ =====
    title_y = height - 140

    # หัวข้อ "ใบประกาศนียบัตร"
    c.setFillColor(secondary)
    c.setFont("Sarabun-Bold", 32)
    c.drawCentredString(width / 2, title_y, "ใบประกาศนียบัตร")

    # เส้นคั่นใต้หัวข้อ
    c.setStrokeColor(primary)
    c.setLineWidth(3)
    line_len = 190
    c.line(
        (width - line_len) / 2,
        title_y - 20,
        (width + line_len) / 2,
        title_y - 20,
    )

    # ข้อความ "มอบให้ไว้เพื่อแสดงว่า"
    c.setFillColor(secondary)
    c.setFont("Sarabun", 20)
    c.drawCentredString(width / 2, title_y - 70, "มอบให้ไว้เพื่อแสดงว่า")

    # ชื่อผู้เรียน
    student_name = data.get("student_name", "")
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 36)
    c.drawCentredString(width / 2, title_y - 120, student_name)

    # ข้อความใต้ชื่อผู้เรียน
    c.setFillColor(secondary)
    c.setFont("Sarabun", 20)
    c.drawCentredString(
        width / 2,
        title_y - 165,
        "ได้สำเร็จการศึกษาตามหลักสูตรเป็นที่เรียบร้อย",
    )

    # ชื่อคอร์ส (ทดสอบบบ)
    course_name = data.get("course_name", "")
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 24)
    c.drawCentredString(width / 2, title_y - 210, course_name)

    # ===== Footer: ผู้สอน & วันที่ =====
    footer_y = 120
    line_width = 200

    instructor_name = data.get("instructor_name", "")
    completion_date = data.get("completion_date", "")

    # ผู้สอน
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 18)
    c.drawCentredString(width * 0.28, footer_y + 20, instructor_name)

    c.setStrokeColor(primary)
    c.setLineWidth(2)
    c.line(
        width * 0.28 - line_width / 2,
        footer_y + 12,
        width * 0.28 + line_width / 2,
        footer_y + 12,
    )

    c.setFillColor(secondary)
    c.setFont("Sarabun", 14)
    c.drawCentredString(width * 0.28, footer_y - 5, "ผู้สอน")

    # วันที่สำเร็จการศึกษา
    c.setFillColor(primary)
    c.setFont("Sarabun-Bold", 18)
    c.drawCentredString(width * 0.72, footer_y + 20, completion_date)

    c.setStrokeColor(primary)
    c.setLineWidth(2)
    c.line(
        width * 0.72 - line_width / 2,
        footer_y + 12,
        width * 0.72 + line_width / 2,
        footer_y + 12,
    )

    c.setFillColor(secondary)
    c.setFont("Sarabun", 14)
    c.drawCentredString(width * 0.72, footer_y - 5, "วันที่สำเร็จการศึกษา")
