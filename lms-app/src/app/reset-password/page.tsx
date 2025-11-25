"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";
import { FaArrowLeft } from "react-icons/fa";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ error ต่อช่อง + flag บังคับ required
  const [p1Error, setP1Error] = useState("");
  const [p2Error, setP2Error] = useState("");
  const [showRequired, setShowRequired] = useState(false);

  const MIN_LEN = 8;

  // realtime validation
  const onChangeP1 = (v: string) => {
    setPassword1(v);
    if (showRequired && v.trim()) setP1Error("");
    if (v && v.length < MIN_LEN) setP1Error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_LEN} ตัวอักษร`);
    else setP1Error("");
    // อัปเดตความตรงกันแบบเรียลไทม์
    if (password2) {
      setP2Error(v === password2 ? "" : "รหัสผ่านยืนยันไม่ตรงกัน");
    }
  };
  const onChangeP2 = (v: string) => {
    setPassword2(v);
    if (showRequired && v.trim()) setP2Error("");
    setP2Error(v && v === password1 ? "" : v ? "รหัสผ่านยืนยันไม่ตรงกัน" : "");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid || !token) {
      toast.error("ลิงก์ไม่ถูกต้อง หรือหมดอายุ");
      return;
    }

    // required
    if (!password1.trim() || !password2.trim()) {
      setShowRequired(true);
      if (!password1.trim()) setP1Error("กรอกรหัสผ่านใหม่");
      if (!password2.trim()) setP2Error("กรอกยืนยันรหัสผ่านใหม่");
      return;
    }

    // length + match
    if (password1.length < MIN_LEN) {
      setP1Error(`รหัสผ่านต้องยาวอย่างน้อย ${MIN_LEN} ตัวอักษร`);
      return;
    }
    if (password1 !== password2) {
      setP2Error("รหัสผ่านยืนยันไม่ตรงกัน");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/api/auth/password/reset/confirm/", {
        uid,
        token,
        new_password1: password1,
        new_password2: password2,
      });
      toast.success("ตั้งรหัสผ่านใหม่สำเร็จ");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "ไม่สามารถตั้งรหัสผ่านใหม่ได้";
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  // helper state -> สถานะ invalid + ข้อความใต้ช่อง
  const isP1Invalid = (showRequired && !password1.trim()) || !!p1Error;
  const helperP1 =
    showRequired && !password1.trim() ? "กรอกรหัสผ่านใหม่" : p1Error;

  const isP2Invalid = (showRequired && !password2.trim()) || !!p2Error;
  const helperP2 =
    showRequired && !password2.trim()
      ? "กรอกยืนยันรหัสผ่านใหม่"
      : p2Error;

  return (
    <div className="min-h-screen flex flex-col items-center mt-3 p-4 font-sans">
      <Toaster
        position="top-center"
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
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-300">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-black mb-6"
        >
          <FaArrowLeft />
          กลับไปหน้าเข้าสู่ระบบ
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-gray-500 text-md">
            กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
          </p>
        </div>

        {/* ⛔ ปิด native tooltip ด้วย noValidate และเราเช็คเองทั้งหมด */}
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
            <input
              type="password"
              value={password1}
              onChange={(e) => onChangeP1(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                isP1Invalid
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
              placeholder="••••••••"
            />
            {helperP1 && (
              <p className="text-red-500 text-xs mt-1">{helperP1}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ยืนยันรหัสผ่านใหม่</label>
            <input
              type="password"
              value={password2}
              onChange={(e) => onChangeP2(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                isP2Invalid
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
              placeholder="••••••••"
            />
            {helperP2 && (
              <p className="text-red-500 text-xs mt-1">{helperP2}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#414E51] cursor-pointer text-white py-3 rounded-md font-semibold hover:bg-[#2b3436] transition-colors disabled:opacity-75"
          >
            ตั้งรหัสผ่านใหม่
          </button>
        </form>
      </div>
    </div>
  );
}
