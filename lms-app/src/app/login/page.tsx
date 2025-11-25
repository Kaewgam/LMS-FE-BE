"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "@/lib/api";

const LoginPage = () => {
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // error/message ต่อช่อง + flag บังคับ required
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showRequired, setShowRequired] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // แบนเนอร์ + สถานะส่งซ้ำ
  const [banner, setBanner] = useState("");
  const [resending, setResending] = useState(false);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // เคลียร์ required ถ้าเริ่มพิมพ์
    if (showRequired && newEmail.trim()) setEmailError("");

    // แสดง error รูปแบบเฉพาะเมื่อมีค่า
    if (newEmail) {
      setEmailError(validateEmail(newEmail) ? "" : "รูปแบบอีเมลไม่ถูกต้อง");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    if (showRequired && v.trim()) setPasswordError("");
  };

  // ==========================
  //  ตัดสินหน้า redirect ตาม role
  // ==========================
  function resolveRedirectFor(me: any) {
  const rawRole = (
    me?.role?.name ??
    me?.role_display ??
    me?.role_name ??
    me?.role ??
    ""
  )
    .toString()
    .toUpperCase();

  const groupNames = Array.isArray(me?.groups)
    ? me.groups.map((g: any) => String(g?.name ?? g).toUpperCase())
    : [];

  // ---- เช็ก role จาก field role อย่างเดียว (ไม่ผูกกับ is_staff / is_superuser แล้ว) ----
  const isAdmin =
    rawRole === "ADMIN" || groupNames.includes("ADMIN");

  const isUniversity =
    rawRole === "UNIVERSITY" || groupNames.includes("UNIVERSITY");

  const isInstructor =
    rawRole === "INSTRUCTOR" || groupNames.includes("INSTRUCTOR");

  const isStudent =
    rawRole === "STUDENT" || groupNames.includes("STUDENT");

  // ---- เรียงลำดับให้ UNIVERSITY ถูกเช็กก่อน ADMIN ----
  // ถ้าบัญชีนี้เป็น UNIVERSITY ให้ไปหน้ามหาวิทยาลัยก่อนเลย
  if (isUniversity) {
    return "/universities-staff/settings_universities-staff";
  }

  // ADMIN (super admin ของระบบ)
  if (isAdmin) {
    return "/admin/settings_admin";
  }

  if (isInstructor) {
    return "/my-courses";
  }

  if (isStudent) {
    return "/home";
  }

  return "/home";
}

  // รับค่าจาก register -> พรีฟิลอีเมล + โชว์แบนเนอร์
  useEffect(() => {
    const e = sp.get("email") || "";
    const jr = sp.get("just_registered");
    if (e) setEmail(e);
    if (jr) {
      setBanner(
        `เราได้ส่งลิงก์ยืนยันไปที่ ${e || "อีเมลของคุณ"} โปรดตรวจกล่องจดหมาย`
      );
    }
  }, [sp]);

  // ==========================
  //  Auto login จาก token ที่ค้างไว้
  //  (เรียก /api/auth/user/ ใหม่ทุกครั้ง)
  // ==========================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const access = localStorage.getItem("access");
    if (!access) return;

    (async () => {
      try {
        // set header จาก token เดิม
        (api.defaults.headers.common as any).Authorization = `Bearer ${access}`;

        const meRes = await api.get("/api/auth/user/");
        const me = meRes?.data || {};
        localStorage.setItem("me", JSON.stringify(me));

        const dest = resolveRedirectFor(me);
        router.replace(dest);
      } catch (err) {
        // token เสีย / หมดอายุ -> ล้าง แล้วคงอยู่หน้า login
        ["access", "refresh", "me"].forEach((k) => localStorage.removeItem(k));
        delete (api.defaults.headers.common as any).Authorization;
      }
    })();
  }, [router]);

  // ปุ่มส่งลิงก์ยืนยันอีกครั้ง
  const resend = async () => {
    if (!email.trim()) {
      setShowRequired(true);
      setEmailError("กรอกอีเมล");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    try {
      setResending(true);
      await api.post("/api/auth/resend/", { email });
      toast.success("ส่งลิงก์ยืนยันใหม่แล้ว");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "ส่งลิงก์ใหม่ไม่สำเร็จ");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    // Required
    if (!trimmedEmail || !trimmedPass) {
      setShowRequired(true);
      if (!trimmedEmail) setEmailError("กรอกอีเมล");
      if (!trimmedPass) setPasswordError("กรอกรหัสผ่าน");
      return;
    }

    // รูปแบบอีเมล
    if (!validateEmail(trimmedEmail)) {
      setEmailError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }

    try {
      setSubmitting(true);

      // ล้าง token เดิม
      ["access", "refresh", "access_token", "refresh_token", "key"].forEach(
        (k) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        }
      );
      delete (api.defaults.headers.common as any).Authorization;

      const { data } = await api.post("/api/auth/login/", {
        email: trimmedEmail,
        password: trimmedPass,
      });

      // รองรับหลายแบบ (jwt, dj-rest-auth, custom)
      if (data?.access) {
        localStorage.setItem("access", data.access);
        if (data?.refresh) localStorage.setItem("refresh", data.refresh);
        (
          api.defaults.headers.common as any
        ).Authorization = `Bearer ${data.access}`;
      } else if (data?.key) {
        localStorage.setItem("key", data.key);
        (
          api.defaults.headers.common as any
        ).Authorization = `Token ${data.key}`;
      } else if (data?.access_token) {
        localStorage.setItem("access", data.access_token);
        (
          api.defaults.headers.common as any
        ).Authorization = `Bearer ${data.access_token}`;
      } else {
        throw new Error("ไม่พบ token จากเซิร์ฟเวอร์");
      }

      const meRes = await api.get("/api/auth/user/");
      const me = meRes?.data || {};
      localStorage.setItem("me", JSON.stringify(me));

      toast.success("เข้าสู่ระบบสำเร็จ!");
      const dest = resolveRedirectFor(me);
      setTimeout(() => router.push(dest), 600);
    } catch (err: any) {
      const raw =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        err?.message ||
        "";

      let thai = raw?.toString() || "";
      const s = thai.toLowerCase();

      if (
        s.includes("invalid credentials") ||
        s.includes("invalid email or password") ||
        s.includes("incorrect") ||
        s.includes("wrong password")
      ) {
        thai = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      } else if (
        s.includes("no active account") ||
        s.includes("disabled") ||
        s.includes("inactive")
      ) {
        thai = "บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
      } else if (
        s.includes("not verified") ||
        s.includes("unverified") ||
        s.includes("verify your email") ||
        s.includes("email is not verified")
      ) {
        thai =
          "บัญชียังไม่ยืนยันอีเมล กรุณาตรวจกล่องจดหมายหรือกด “ส่งลิงก์ยืนยันอีกครั้ง”";
      } else if (s.includes("user not found") || s.includes("no such user")) {
        thai = "ไม่พบบัญชีผู้ใช้นี้";
      } else if (!thai) {
        thai = "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
      }

      toast.error(thai);
    } finally {
      setSubmitting(false);
    }
  };

  // สถานะ invalid ต่อช่อง + ข้อความช่วย
  const isEmailInvalid = (showRequired && !email.trim()) || !!emailError;
  const emailHelper =
    showRequired && !email.trim() ? "กรอกอีเมลให้ครบ" : emailError;

  const isPassInvalid = (showRequired && !password.trim()) || !!passwordError;
  const passHelper =
    showRequired && !password.trim() ? "กรอกรหัสผ่าน" : passwordError;

  return (
    <div className="min-h-screen flex flex-col items-center mt-3 p-4 font-sans">
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

      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">ลงชื่อเข้าสู่ระบบ</h1>
          <p className="text-gray-500 text-md">ยินดีต้อนรับกลับมา!</p>
        </div>

        {/* แบนเนอร์แจ้งเตือน + ปุ่ม resend */}
        {banner && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm">
            {banner}
            <button
              type="button"
              onClick={resend}
              className="ml-2 underline"
              disabled={resending}
            >
              {resending ? "กำลังส่ง…" : "ส่งลิงก์ยืนยันอีกครั้ง"}
            </button>
          </div>
        )}

        {/* ปิด native validation ด้วย noValidate */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            {emailHelper && (
              <p className="text-red-500 text-xs mt-1">{emailHelper}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  isPassInvalid
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-400"
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-700"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passHelper && (
              <p className="text-red-500 text-xs mt-1">{passHelper}</p>
            )}
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`w-full text-white py-3 rounded-md font-semibold transition-colors ${
              submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#414E51] hover:bg-[#2b3436] cursor-pointer"
            }`}
          >
            {submitting ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
