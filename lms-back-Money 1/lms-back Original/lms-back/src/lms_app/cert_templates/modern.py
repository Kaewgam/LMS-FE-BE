# lms_app/cert_templates/modern.py
from reportlab.lib.colors import HexColor

def draw_modern(c, data):
    primary = HexColor(data["primary_color"])
    secondary = HexColor(data["secondary_color"])

    # พื้นหลังขาว
    c.setFillColor(HexColor("#FFFFFF"))
    c.rect(0, 0, 842, 595, fill=1, stroke=0)

    # แถบใหญ่ด้านซ้าย (UI Modern)
    c.setFillColor(primary)
    c.rect(0, 0, 250, 595, fill=1, stroke=0)

    # Title
    c.setFillColor(secondary)
    c.setFont("Sarabun-Bold", 28)
    c.drawString(300, 520, "ใบประกาศนียบัตร")

    c.setStrokeColor(primary)
    c.setLineWidth(2)
    c.line(300, 500, 520, 500)

    # อธิบาย
    c.setFont("Sarabun", 18)
    c.setFillColor(secondary)
    c.drawString(300, 465, "มอบให้ไว้เพื่อแสดงว่า")

    # ชื่อผู้เรียน
    c.setFont("Sarabun-Bold", 30)
    c.setFillColor(primary)
    c.drawString(300, 425, data["student_name"])

    # รายละเอียด
    c.setFillColor(secondary)
    c.setFont("Sarabun", 18)
    c.drawString(300, 385, "ได้สำเร็จการศึกษาตามหลักสูตร")

    # ชื่อคอร์ส
    c.setFont("Sarabun-Bold", 22)
    c.setFillColor(primary)
    c.drawString(300, 350, data["course_name"])

    # Instructor
    c.setFillColor(secondary)
    c.setFont("Sarabun-Bold", 16)
    c.drawString(300, 190, data["instructor_name"])
    c.setFont("Sarabun", 14)
    c.drawString(300, 170, "ผู้สอน")

    # Completion
    c.setFont("Sarabun-Bold", 16)
    c.drawString(600, 190, data["completion_date"])
    c.setFont("Sarabun", 14)
    c.drawString(600, 170, "วันที่สำเร็จการศึกษา")
