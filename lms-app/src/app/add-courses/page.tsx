"use client";

import React, { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaPlus,
  FaPen,
  FaBook,
  FaFileAlt,
  FaChevronDown,
  FaArrowLeft,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api, { listCategories, mapThaiStatusToApi } from "@/lib/api";

/* ---------- Combobox Types ---------- */
interface ComboboxOption {
  value: string;
  label: string;
}
interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid?: boolean;
  helperText?: string;
}

/* ---------- utils: ensure path starts with /api ---------- */
function ensureApiPath(p: string): string {
  if (!p) return "";
  return p.startsWith("/api") ? p : `/api${p.startsWith("/") ? "" : "/"}${p}`;
}

/* ---------- env & path helpers ---------- */
const UNI_ID = process.env.NEXT_PUBLIC_UNIVERSITY_ID?.trim() || "";
const rawCurrPath =
  process.env.NEXT_PUBLIC_CURRICULUMS_PATH?.trim() ||
  (UNI_ID ? `/universities/${UNI_ID}/curriculums/` : "");
const CURR_PATH = ensureApiPath(rawCurrPath);
const normalizeTitle = (s: string) => s.trim().replace(/\s+/g, " ");

/* ---------- Smart Back (ภายในไฟล์นี้) ---------- */
function smartBack(
  router: { back: () => void; push: (p: string) => void },
  searchParams: ReturnType<typeof useSearchParams>,
  fallback = "/my-courses"
) {
  const from = searchParams.get("from") || searchParams.get("returnTo");
  if (from) {
    try {
      const decoded = decodeURIComponent(from);
      if (decoded.startsWith("/")) return router.push(decoded);
    } catch {}
  }
  if (typeof window !== "undefined" && window.history.length > 1) {
    return router.back();
  }
  if (typeof document !== "undefined" && document.referrer) {
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === window.location.origin) {
        return router.push(`${ref.pathname}${ref.search}${ref.hash}`);
      }
    } catch {}
  }
  router.push(fallback);
}

/* ---------- Combobox (UI) ---------- */
const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  invalid,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";
  useEffect(() => setInputValue(selectedLabel), [selectedLabel]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setInputValue(selectedLabel);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedLabel]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`p-3 w-full rounded-lg text-sm bg-white text-gray-800 pr-10 border focus:outline-none focus:ring-1 ${
            invalid
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-gray-400"
          }`}
        />
        <FaChevronDown className="absolute right-[15px] top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>

      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((o) => (
              <li
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setInputValue(o.label);
                  setIsOpen(false);
                }}
                className="p-3 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {o.label}
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-gray-500">ไม่พบข้อมูล</li>
          )}
        </ul>
      )}
      {helperText && <p className="text-red-500 text-xs mt-1">{helperText}</p>}
    </div>
  );
};

/* ---------- Page ---------- */
type CurriculumRow = { id: string; title?: string; name?: string };

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [titleCheck, setTitleCheck] = useState({
    checking: false,
    duplicate: false,
  });
  // UI states
  const [status, setStatus] = useState<"เปิด" | "ปิด" | "ซ่อน">("ปิด"); // UI only
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    code: "", // ← ผู้สอนกรอกเลข 6 หลัก
    curriculum: "", // UUID
  });
  // ใช้สำหรับเตือนก่อนย้อนกลับ
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasEdited) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasEdited]);

  // error ต่อช่อง + flag required
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const [showRequired, setShowRequired] = useState(false);

  // options from API
  const [currOptions, setCurrOptions] = useState<ComboboxOption[]>([]);
  const [loadingCurr, setLoadingCurr] = useState(true);
  const [catOptions, setCatOptions] = useState<ComboboxOption[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);

  // โหลดข้อมูลจาก API (categories + curriculums)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // categories
        try {
          const categories = await listCategories();
          if (alive) {
            const opts = categories.map((c) => ({
              value: c.id,
              label: c.name,
            }));
            setCatOptions(opts);
          }
        } catch (err) {
          console.error("Failed to load categories:", err);
          if (alive) toast.error("โหลดหมวดหมู่ไม่สำเร็จ");
        } finally {
          if (alive) setLoadingCat(false);
        }

        // curriculums
        try {
          const path = CURR_PATH;
          if (!path) {
            setLoadingCurr(false);
            toast.error(
              "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_CURRICULUMS_PATH หรือ NEXT_PUBLIC_UNIVERSITY_ID"
            );
            return;
          }
          const { data } = await api.get<
            CurriculumRow[] | { results?: CurriculumRow[] }
          >(path);
          const list: CurriculumRow[] = Array.isArray(data)
            ? data
            : (data as any)?.results ?? [];
          const opts = list.map((c) => ({
            value: c.id,
            label: c.title || c.name || c.id,
          }));
          if (alive) {
            setCurrOptions(opts);
          }
        } catch (err) {
          console.error("Failed to load curriculums:", err);
          if (alive) toast.error("โหลดรายชื่อหลักสูตรไม่สำเร็จ");
        } finally {
          if (alive) setLoadingCurr(false);
        }
      } finally {
        if (alive) {
          setLoadingCat(false);
          setLoadingCurr(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formRef = useRef<HTMLFormElement | null>(null);
  const submittedRef = useRef(false);
  const [saving, setSaving] = useState(false);

  const requiredText = (field: keyof typeof formData) => {
    switch (field) {
      case "title":
        return "กรอกชื่อคอร์สให้ครบ";
      case "description":
        return "กรอกคำอธิบายคอร์สให้ครบ";
      case "category":
        return "เลือกหมวดหมู่คอร์สให้ครบ";
      case "code":
        return "กรอกรหัสคอร์สให้ครบ";
      case "curriculum":
        return "เลือกหลักสูตรให้ครบ";
      default:
        return "กรอกข้อมูลให้ครบ";
    }
  };

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  useEffect(() => {
    const t = normalizeTitle(formData.title);
    if (!t) {
      setTitleCheck({ checking: false, duplicate: false });
      setErrors((p) => ({ ...p, title: "" }));
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setTitleCheck({ checking: true, duplicate: false });

        const { data } = await api.get("/api/courses/", {
          params: { title__iexact: t },
          signal: ctrl.signal as any,
        });

        const list: any[] = Array.isArray(data) ? data : data?.results ?? [];
        const exists = list.some(
          (c) =>
            String(c?.title ?? "")
              .trim()
              .toLowerCase() === t.toLowerCase()
        );

        setTitleCheck({ checking: false, duplicate: exists });
        setErrors((p) => ({
          ...p,
          title: exists ? "มีชื่อคอร์สนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" : "",
        }));
      } catch (err: any) {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          setTitleCheck((s) => ({ ...s, checking: false }));
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title]);

  const markEdited = () => {
    if (!hasEdited) setHasEdited(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    markEdited();
    const { name, value } = e.target as {
      name: keyof typeof formData;
      value: string;
    };
    if (name === "code") {
      const numeric = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, code: numeric }));
      if (showRequired && numeric) setErrors((p) => ({ ...p, code: "" }));
      if (numeric && numeric.length !== 6) {
        setErrors((p) => ({ ...p, code: "รหัสคอร์สต้องเป็นตัวเลข 6 หลัก" }));
      } else if (numeric.length === 6) {
        setErrors((p) => ({ ...p, code: "" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (showRequired && value.trim()) {
      setErrors((p) => ({ ...p, [name]: "" }));
    }
  };

  const handleCategoryChange = (v: string) => {
    markEdited();
    setFormData((p) => ({ ...p, category: v }));
    if (showRequired && v) setErrors((p) => ({ ...p, category: "" }));
  };

  const handleCurriculumChange = (v: string) => {
    markEdited();
    setFormData((p) => ({ ...p, curriculum: v }));
    if (showRequired && v) setErrors((p) => ({ ...p, curriculum: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    markEdited();
    const file = e.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
    else setImagePreview(null);
  };

  const hasEmptyRequired = () =>
    ["title", "description", "category", "code", "curriculum"].some(
      (k) => !(formData as any)[k]?.toString().trim()
    );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;

    // กันกดซ้ำ
    if (saving || submittedRef.current) return;
    submittedRef.current = true;

    if (titleCheck.duplicate) {
      toast.error("ชื่อคอร์สซ้ำ กรุณาใช้ชื่ออื่น");
      submittedRef.current = false;
      return;
    }
    // required check
    if (hasEmptyRequired()) {
      setShowRequired(true);
      const next: Partial<Record<keyof typeof formData, string>> = {};
      (
        ["title", "description", "category", "code", "curriculum"] as (
          | "title"
          | "description"
          | "category"
          | "code"
          | "curriculum"
        )[]
      ).forEach((f) => {
        if (!formData[f]?.toString().trim()) next[f] = requiredText(f);
      });
      setErrors((p) => ({ ...p, ...next }));
      submittedRef.current = false;
      return;
    }

    // code = 6 digits
    if (formData.code.length !== 6) {
      setErrors((p) => ({ ...p, code: "รหัสคอร์สต้องเป็นตัวเลข 6 หลัก" }));
      submittedRef.current = false;
      return;
    }

    // curriculum uuid
    if (!uuidLike.test(formData.curriculum)) {
      setErrors((p) => ({ ...p, curriculum: "เลือกรายการหลักสูตรให้ถูกต้อง" }));
      submittedRef.current = false;
      return;
    }

    const fd = new FormData(formRef.current);

    fd.set("title", normalizeTitle(formData.title));
    // ส่งค่าให้ backend ในฟิลด์ที่รองรับ
    fd.set("curriculum", formData.curriculum.trim().toLowerCase());
    fd.set("enroll_token", formData.code); // ✅ สำคัญ: map code -> enroll_token
    fd.set("category", formData.category); // ✅ ส่งหมวดหมู่

    // เก็บเฉพาะฟิลด์ที่ BE รองรับ
    const allowed = new Set([
      "title",
      "description",
      "level",
      "curriculum",
      "visibility",
      "enroll_token",
      "meeting_link",
      "banner_img",
      "category",
    ]);
    for (const [k] of Array.from(fd.entries())) {
      if (!allowed.has(k)) fd.delete(k);
    }

    // เพิ่มสถานะคอร์ส
    const apiStatus = mapThaiStatusToApi(status);
    if (apiStatus) fd.set("visibility", apiStatus);

    try {
      setSaving(true);
      await api.post("/api/courses/", fd, { withCredentials: true });
      toast.success("สร้างคอร์สสำเร็จ");
      router.replace("/my-courses");
    } catch (err: any) {
      const raw = err?.response?.data;
      if (raw?.title) {
        setErrors((p) => ({
          ...p,
          title: Array.isArray(raw.title) ? raw.title[0] : String(raw.title),
        }));
      }
      const msg = raw ? JSON.stringify(raw) : err?.message || "เกิดข้อผิดพลาด";
      toast.error(
        msg.toLowerCase().includes("duplicate")
          ? "ชื่อคอร์สซ้ำ กรุณาใช้ชื่ออื่น"
          : msg
      );
      submittedRef.current = false;
    } finally {
      setSaving(false);
    }
  }

  // helper invalid/helper text
  const isInvalid = (f: keyof typeof formData) =>
    (showRequired && !formData[f]?.toString().trim()) || !!errors[f];
  const helper = (f: keyof typeof formData) =>
    showRequired && !formData[f]?.toString().trim()
      ? requiredText(f)
      : errors[f] || "";

  // 👉 ปุ่มย้อนกลับ (เรียกใช้ smartBack + confirm ถ้าแก้ไขแล้ว)
  const handleBack = () => {
    if (hasEdited) {
      const ok = window.confirm(
        "มีการกรอกข้อมูลที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?"
      );
      if (!ok) return;
    }
    smartBack(router, searchParams, "/my-courses");
  };

  return (
    <form
      ref={formRef}
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      className="w-full max-w-7xl mx-auto text-black mt-6 px-4 sm:px-6 lg:px-8 mb-10"
    >
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

      {/* ส่วนหัว */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-4">คอร์สของฉัน</h1>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="py-3 px-8 w-full sm:w-auto bg-white text-black border border-gray-300 rounded-full text-base font-semibold hover:bg-gray-100"
            title="ย้อนกลับ"
          >
            <FaArrowLeft className="inline-block mr-2" />
            ย้อนกลับ
          </button>
          <button
            type="submit"
            disabled={
              saving ||
              loadingCurr ||
              loadingCat ||
              submittedRef.current ||
              titleCheck.checking ||
              titleCheck.duplicate
            }
            className="py-3 px-8 w-full sm:w-auto bg-[#31E3CB] text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving
              ? "กำลังบันทึก..."
              : titleCheck.checking
              ? "กำลังตรวจสอบชื่อ..."
              : "สร้างคอร์ส"}
          </button>
        </div>
      </div>

      {/* ฟอร์มหลัก 2 คอลัมน์ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
        {/* ซ้าย */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="font-semibold text-xl flex items-center gap-2 mb-2">
              <FaPen /> ชื่อคอร์ส
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              type="text"
              placeholder="ชื่อคอร์ส"
              className={`p-3 w-full rounded-lg text-sm border focus:outline-none focus:ring-1 ${
                isInvalid("title")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
            />
            {helper("title") && (
              <p className="text-red-500 text-xs mt-1">{helper("title")}</p>
            )}
            {titleCheck.checking && !errors.title && formData.title.trim() && (
              <p className="text-gray-500 text-xs mt-1">
                กำลังตรวจสอบชื่อคอร์ส…
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-xl flex items-center gap-2 mb-2">
              คำอธิบายคอร์ส
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="คำอธิบายคอร์ส"
              className={`p-3 w-full rounded-lg text-sm min-h-[90px] resize-y border focus:outline-none focus:ring-1 ${
                isInvalid("description")
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-gray-400"
              }`}
            />
            {helper("description") && (
              <p className="text-red-500 text-xs mt-1">
                {helper("description")}
              </p>
            )}
          </div>

          <div>
            <label className="font-semibold text-xl flex items-center gap-2 mb-2">
              หมวดหมู่คอร์ส
            </label>
            <Combobox
              options={catOptions}
              value={formData.category}
              onChange={handleCategoryChange}
              placeholder={
                loadingCat
                  ? "กำลังโหลด..."
                  : catOptions.length
                  ? "เลือกหรือค้นหาหมวดหมู่"
                  : "ไม่มีรายการหมวดหมู่"
              }
              invalid={isInvalid("category")}
              helperText={helper("category")}
            />
          </div>
        </div>

        {/* ขวา: อัปโหลดรูป (optional) */}
        <div className="flex flex-col items-center justify-start">
          <label className="font-semibold text-xl flex items-center gap-2 mb-2 w-full lg:sr-only">
            ภาพหน้าปกคอร์ส
          </label>
          <div
            className="w-full aspect-video border border-gray-300 rounded-2xl flex flex-col items-center justify-center text-sm text-gray-600 font-bold cursor-pointer bg-white hover:bg-gray-50 overflow-hidden"
            onClick={() => document.getElementById("uploadInput")?.click()}
          >
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FaPlus className="text-base text-gray-400" />
                <span>อัปโหลดภาพหน้าปกคอร์ส</span>
              </div>
            )}
            <input
              type="file"
              name="banner_img"
              accept="image/*"
              id="uploadInput"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>
      </div>

      {/* แถวสอง */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-6">
        <div>
          <label className="font-semibold text-xl flex items-center gap-2 mb-2">
            <FaBook /> รหัสคอร์สเรียน
          </label>
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            type="text"
            placeholder="กรอกรหัสตัวเลข 6 หลัก"
            maxLength={6}
            className={`p-3 w-full rounded-lg text-sm border focus:outline-none focus:ring-1 ${
              isInvalid("code")
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-gray-400"
            }`}
          />
          {helper("code") && (
            <p className="text-red-500 text-xs mt-1">{helper("code")}</p>
          )}
        </div>

        <div>
          <label className="font-semibold text-xl flex items-center gap-2 mb-2">
            <FaFileAlt /> หลักสูตร
          </label>
          <Combobox
            options={currOptions}
            value={formData.curriculum}
            onChange={handleCurriculumChange}
            placeholder={
              loadingCurr
                ? "กำลังโหลด..."
                : currOptions.length
                ? "เลือกหรือค้นหาหลักสูตร"
                : "ไม่มีรายการหลักสูตร"
            }
            invalid={isInvalid("curriculum")}
            helperText={helper("curriculum")}
          />
          <input type="hidden" name="curriculum" value={formData.curriculum} />
        </div>
      </div>

      {/* สถานะคอร์ส (UI only) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-xl font-semibold my-8">
        <span className="shrink-0">สถานะคอร์ส</span>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 font-normal">
            <input
              type="radio"
              name="status"
              value="เปิด"
              checked={status === "เปิด"}
              onChange={(e) => {
                markEdited();
                setStatus(e.target.value as any);
              }}
            />{" "}
            เปิด
          </label>
          <label className="flex items-center gap-2 font-normal">
            <input
              type="radio"
              name="status"
              value="ปิด"
              checked={status === "ปิด"}
              onChange={(e) => {
                markEdited();
                setStatus(e.target.value as any);
              }}
            />{" "}
            ปิด
          </label>
          <label className="flex items-center gap-2 font-normal">
            <input
              type="radio"
              name="status"
              value="ซ่อน"
              checked={status === "ซ่อน"}
              onChange={(e) => {
                markEdited();
                setStatus(e.target.value as any);
              }}
            />{" "}
            ซ่อน
          </label>
        </div>
      </div>

      {/* ฟิลด์ที่ backend ต้องการแต่เราไม่มี UI */}
      <input type="hidden" name="level" value="beginner" />
    </form>
  );
};

export default Page;
