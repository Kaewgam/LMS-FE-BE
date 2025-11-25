from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
# from allauth.exceptions import ImmediateHttpResponse
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from django.http import JsonResponse
from .models import University, UniversityMember, RoleChoices, InstructorInvitation

class MySocialAccountAdapter(DefaultSocialAccountAdapter):

    def populate_user(self, request, sociallogin, data):
        """
        ฟังก์ชันนี้จะทำหน้าที่ทั้ง "ตรวจสอบสิทธิ์" และ "สร้าง User ใหม่"
        โดยจะถูกเรียกใช้เฉพาะเมื่อผู้ใช้ลงทะเบียนผ่าน Social Account เป็นครั้งแรกเท่านั้น
        """
        # --- check if email is valid
        # --- DEBUG: พิมพ์ข้อมูลทั้งหมดที่ได้รับจาก Google ---
        print(f"--- DEBUG: Raw data received from social provider: {data} ---")
        
        # --- ดึงอีเมลจาก `data` dictionary โดยตรง และทำการตรวจสอบสิทธิ์ ---
        email = data.get('email')
        
        print(f"--- DEBUG: Extracted email: '{email}' ---")

        if '@' not in email:
            raise serializers.ValidationError(
                {
                    'detail': 'Invalid email format from social provider.',
                }
            )

        domain = email.split('@')[1]
        try:
            university = University.objects.get(email_domain__iexact=domain)
            print(f"--- AUTH CHECK PASSED: Domain '{domain}' is valid for University '{university.name}' ---")
        except University.DoesNotExist:
            # ถ้าไม่เจอ University ให้หยุดการทำงานทันที และส่ง Error กลับไป
            print(f"--- AUTH CHECK FAILED: Domain '{domain}' is not registered. ---")
            raise PermissionDenied(
                {
                    'detail': 'Permission Denied',
                    'message': 'อีเมลของคุณไม่อยู่ในสังกัดของมหาวิทยาลัยที่ได้รับอนุญาตให้ใช้งานระบบ',
                }
            )

        # --- create user object and populate data
        user = super().populate_user(request, sociallogin, data)

        # เติมข้อมูล `full_name` จาก Google
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        user.full_name = f"{first_name} {last_name}".strip()
        if not user.full_name:
            user.full_name = user.email

        # กำหนดค่า `university` ที่เราหาเจอจากการตรวจสอบสิทธิ์
        user.university = university
        # user.save()
        # เพิ่มเข้าไปใน UniversityMember ด้วย

        # try:
        #     instructor_invitation = InstructorInvitation.objects.filter(email=user.email, university=university).first()
        #     if instructor_invitation:
        #         instructor_invitation.is_accepted = True
        #         instructor_invitation.save()
        #         UniversityMember.objects.filter(user=user, university=university).update(role=RoleChoices.INSTRUCTOR)
        #         print(f"--- Instructor invitation accepted for user '{user.email}' ---")
        # except Exception as e:
        #     print(f"--- ERROR: {e} ---")

        print(f"--- POPULATING: Creating new user '{user.email}' for University '{university.name}' ---")
        return user
