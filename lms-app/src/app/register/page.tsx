"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import api from "@/lib/api";

type Role = "learner" | "instructor" | null;

const RegisterPage = () => {
  const router = useRouter();

  // 1) เลือกบทบาท
  const [role, setRole] = useState<Role>(null);

  // 2) ฟอร์ม
  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  };
  const [formData, setFormData] = useState({ ...emptyForm });

  // error ต่อช่อง + ตัวบังคับโชว์ “กรอก…ให้ครบ” หลัง submit
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [showRequired, setShowRequired] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const requiredText = (field: keyof typeof formData) => {
    switch (field) {
      case "firstName":
        return "กรอกชื่อ";
      case "lastName":
        return "กรอกนามสกุล";
      case "email":
        return "กรอกอีเมล";
      case "password":
        return "กรอกรหัสผ่าน";
      case "confirmPassword":
        return "กรอกยืนยันรหัสผ่าน";
      default:
        return "กรอกข้อมูล";
    }
  };

  // ✅ รีเซ็ต validation (และเลือกล้างค่าช่องได้)
  const resetValidation = (clearFields = false) => {
    setErrors({});
    setShowRequired(false);
    setPasswordVisibility({ password: false, confirmPassword: false });
    if (clearFields) setFormData({ ...emptyForm });
  };

  const handleRoleSelect = (selectedRole: Exclude<Role, null>) => {
    setRole(selectedRole);
    resetValidation(false); // เปลี่ยนเป็น true ถ้าอยากล้างค่าช่องด้วยเมื่อสลับบทบาท
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    setFormData((prev) => ({ ...prev, [name]: value }));

    // เคลียร์ required ถ้าผู้ใช้เริ่มพิมพ์
    if (showRequired && value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // อีเมล
    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value
          ? validateEmail(value)
            ? ""
            : "รูปแบบอีเมลไม่ถูกต้อง"
          : prev.email,
      }));
    }

    // ตรวจรหัสผ่านตรงกันแบบ realtime
    if (name === "password" || name === "confirmPassword") {
      const pass = name === "password" ? value : formData.password;
      const confirm =
        name === "confirmPassword" ? value : formData.confirmPassword;
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          confirm && pass !== confirm
            ? "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน"
            : "",
      }));
    }
  };

  const togglePasswordVisibility = (field: "password" | "confirmPassword") =>
    setPasswordVisibility((p) => ({ ...p, [field]: !p[field] }));

  const hasEmptyRequired = () =>
    Object.entries(formData).some(([_, v]) => (v as string).trim() === "");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!role) {
      toast.error("กรุณาเลือกบทบาทก่อนสมัคร");
      return;
    }

    // ถ้ามีช่องว่าง → บังคับโชว์ required ทุกช่องที่ว่าง
    if (hasEmptyRequired()) {
      setShowRequired(true);
      const newErrors: Partial<Record<keyof typeof formData, string>> = {};
      (Object.keys(formData) as (keyof typeof formData)[]).forEach((f) => {
        if (!formData[f].trim()) newErrors[f] = requiredText(f);
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    // เช็คอีเมล
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "รูปแบบอีเมลไม่ถูกต้อง" }));
      return;
    }

    // เช็ครหัสผ่านตรงกัน
    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน",
      }));
      return;
    }

    // พร้อมส่ง
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        role: (role === "instructor" ? "INSTRUCTOR" : "STUDENT") as
          | "INSTRUCTOR"
          | "STUDENT",
      };

      await api.post("/api/auth/register/", payload);
      toast.success("ลงทะเบียนสำเร็จ! โปรดตรวจสอบอีเมลเพื่อยืนยันบัญชี ✉️");
      setTimeout(() => router.push("/login"), 900);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "สมัครไม่สำเร็จ";

      // แปลงข้อความ error จากเป็นอังกฤษเป็นไทย
      let thaiMessage = detail;
      if (
        detail.toLowerCase().includes("email already registered") ||
        detail.toLowerCase().includes("email already exists") ||
        detail.toLowerCase().includes("user with this email already exists") ||
        detail
          .toLowerCase()
          .includes("a user is already registered with this e-mail address")
      ) {
        thaiMessage = "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น";
      } else if (detail.toLowerCase().includes("registration failed")) {
        thaiMessage = "สมัครไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      }

      toast.error(thaiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== UI เลือกบทบาท =====
  if (!role) {
    return (
      <div className="min-h-screen flex flex-col mt-10 items-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-semibold mb-2">เข้าร่วมกับเรา</h1>
          <p className="text-gray-600 text-lg mb-8">
            กรุณาเลือกบทบาทของคุณเพื่อลงทะเบียน
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => handleRoleSelect("learner")}
              className="p-8 bg-white rounded-xl shadow-md cursor-pointer transition-transform transform hover:scale-105 border-2 border-gray-300 hover:border-blue-500"
            >
              <FaUserGraduate className="text-5xl text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold">ผู้เรียน</h2>
              <p className="text-gray-500 mt-2">
                สำหรับผู้ที่ต้องการค้นหาและลงเรียนคอร์สต่างๆ
              </p>
            </div>
            <div
              onClick={() => handleRoleSelect("instructor")}
              className="p-8 bg-white rounded-xl shadow-md cursor-pointer transition-transform transform hover:scale-105 border-2 border-gray-300 hover:border-teal-500"
            >
              <FaChalkboardTeacher className="text-5xl text-teal-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold">ผู้สอน</h2>
              <p className="text-gray-500 mt-2">
                สำหรับผู้ที่ต้องการสร้างและเผยแพร่คอร์สเรียน
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ฟอร์มสมัคร =====
  const isInvalid = (field: keyof typeof formData) =>
    (showRequired && !formData[field].trim()) || !!errors[field];

  const helper = (field: keyof typeof formData) =>
    showRequired && !formData[field].trim()
      ? requiredText(field)
      : errors[field] || "";

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: "8px",
            fontSize: "16px",
            padding: "16px 24px",
            fontWeight: "600",
          },
          success: { style: { background: "#F0FDF4", color: "black" } },
          error: { style: { background: "#FFF1F2", color: "black" } },
        }}
      />

      <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg border border-gray-300 mt-3">
        <button
          onClick={() => {
            setRole(null);
            resetValidation(true); // ล้างกรอบแดง + ล้างค่าช่องเมื่อกลับไปหน้าเลือกบทบาท
          }}
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-black mb-6"
        >
          <FaArrowLeft />
          กลับไปเลือกบทบาท
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold  mb-2">
            ลงทะเบียนสำหรับ
            <span
              className={role === "learner" ? "text-blue-500" : "text-teal-500"}
            >
              {role === "learner" ? " ผู้เรียน" : " ผู้สอน"}
            </span>
          </h1>
          <p className="text-gray-500 text-md">
            กรอกข้อมูลเพื่อสร้างบัญชีของคุณ
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">ชื่อ</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  isInvalid("firstName")
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-400"
                }`}
              />
              {helper("firstName") && (
                <p className="text-red-500 text-xs mt-1">
                  {helper("firstName")}
                </p>
              )}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium mb-1">นามสกุล</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  isInvalid("lastName")
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-400"
                }`}
              />
              {helper("lastName") && (
                <p className="text-red-500 text-xs mt-1">
                  {helper("lastName")}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">อีเมล</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                isInvalid("email")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
            />
            {helper("email") && (
              <p className="text-red-500 text-xs mt-1">{helper("email")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={passwordVisibility.password ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  isInvalid("password")
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("password")}
                className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              >
                {passwordVisibility.password ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {helper("password") && (
              <p className="text-red-500 text-xs mt-1">{helper("password")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={passwordVisibility.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  isInvalid("confirmPassword")
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              >
                {passwordVisibility.confirmPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            </div>
            {helper("confirmPassword") && (
              <p className="text-red-500 text-xs mt-1">
                {helper("confirmPassword")}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full text-white py-3 rounded-md font-semibold transition-colors mt-4 ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#414E51] hover:bg-[#2b3436] cursor-pointer"
            }`}
          >
            {submitting ? "กำลังสมัคร…" : "สมัครสมาชิก"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
