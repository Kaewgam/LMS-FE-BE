"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import api from "@/lib/api";

const ForgotPasswordPage = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ เก็บ error ของฟิลด์
  const [emailError, setEmailError] = useState("");
  // ✅ ใช้เพื่อ “บังคับให้โชว์กรอบแดง + ข้อความกรอกให้ครบ” หลังจากกด Submit แล้วแต่ยังว่าง
  const [showRequired, setShowRequired] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // ถ้ากำลังแสดง required และผู้ใช้เริ่มพิมพ์ ให้ซ่อน required ทันที
    if (showRequired && newEmail.trim()) setShowRequired(false);

    if (newEmail && !validateEmail(newEmail)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = email.trim();

    // ว่าง -> กรอบแดง + ข้อความ “กรอกข้อมูลให้ครบ”
    if (!trimmed) {
      setShowRequired(true);
      setEmailError(""); // ไม่ทับด้วยข้อความรูปแบบอีเมล
      return;
    }

    if (!validateEmail(trimmed)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
      setShowRequired(false);
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/auth/password/reset/", { email: trimmed });
      toast.success("หากอีเมลของคุณมีอยู่ในระบบ เราได้ส่งลิงก์ไปให้แล้ว");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ เงื่อนไขกรอบแดง: ถ้า showRequired (ว่าง) หรือ มี emailError
  const isEmailInvalid = showRequired || !!emailError;
  // ✅ ข้อความใต้ช่อง: ลำดับความสำคัญ = required ก่อน แล้วค่อย emailError
  const emailHelperText = showRequired
    ? "กรอกข้อมูลให้ครบ"
    : emailError
    ? emailError
    : "";

  return (
    <div className="min-h-screen flex flex-col items-center mt-3 p-4 font-sans">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: "8px", fontSize: "16px", padding: "16px 24px", fontWeight: "600" },
          success: { style: { background: "#F0FDF4", color: "black" } },
          error: { style: { background: "#FFF1F2", color: "black" } },
        }}
      />

      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-300">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-black mb-6"
        >
          <FaArrowLeft />
          กลับไปหน้าเข้าสู่ระบบ
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">ลืมรหัสผ่าน</h1>
          <p className="text-gray-500 text-md">กรอกอีเมลเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* noValidate เพื่อปิด tooltip default ของ browser */}
          <div>
            <label className="block text-sm font-medium mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                isEmailInvalid
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
              placeholder="you@example.com"
            />
            {emailHelperText && (
              <p className="text-red-500 text-sm mt-1">{emailHelperText}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#414E51] cursor-pointer text-white py-3 rounded-md font-semibold hover:bg-[#2b3436] transition-colors disabled:opacity-60"
          >
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
