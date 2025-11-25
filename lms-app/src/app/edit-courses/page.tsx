"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import {
  FaPlus,
  FaPen,
  FaBook,
  FaFileAlt,
  FaChevronDown,
  FaExclamationTriangle,
  FaTimes,
  FaTrash,
  FaSync,
  FaArrowLeft,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  getCourse,
  updateCourse,
  deleteCourse,
  listCategories,
  listCurricula,
  requestCourseApproval,
  getCourseApprovalStatus,
  mapThaiStatusToApi,
  mapApiStatusToThai,
  STATUS_MAPPING,
  courseStatusToApprovalUi,
  approvalUiToTh,
  approvalUiColor,
  type OptionDTO,
} from "@/lib/api";

// ====== Modal ยืนยันลบ ======
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== Combobox (ไม่แตะ UI เดิม) ======
interface ComboboxOption {
  value: string;
  label: string;
}
interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}
const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptionLabel =
    options.find((o) => o.value === value)?.label || "";
  useEffect(() => {
    setInputValue(selectedOptionLabel);
  }, [selectedOptionLabel, value, options]);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        const currentLabel =
          options.find((o) => o.value === value)?.label || "";
        setInputValue(currentLabel);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [value, options]);

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
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          className="p-3 w-full border border-gray-300 rounded-lg text-sm bg-white text-gray-800 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
          disabled={disabled}
        />
        <FaChevronDown className="absolute right-[15px] top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>
      {isOpen && !disabled && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filtered.length ? (
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
    </div>
  );
};

// ====== หน้า Edit ======
const EditCoursePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<"เปิด" | "ปิด" | "ซ่อน">("ปิด");
  const [approvalStatus, setApprovalStatus] = useState<
    "approved" | "pending" | "rejected" | ""
  >("");
  const [hasBeenEdited, setHasBeenEdited] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    code: "",
    curriculum: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // options จาก API (ถ้า 404 จะปล่อยว่าง)
  const [catOpts, setCatOpts] = useState<ComboboxOption[]>([]);
  const [curOpts, setCurOpts] = useState<ComboboxOption[]>([]);
  const categoryOptions = catOpts;
  const curriculumOptions = curOpts;

  // โหลดตัวเลือก + คอร์ส
  useEffect(() => {
    const courseId = searchParams.get("id");
    if (!courseId) return;

    (async () => {
      try {
        // 1) โหลด options (ถ้ามี endpoint)
        let catOptsLoaded: ComboboxOption[] = [];
        let curOptsLoaded: ComboboxOption[] = [];
        try {
          const cats: OptionDTO[] = await listCategories();
          catOptsLoaded = cats.map((c) => ({ value: c.id, label: c.name }));
        } catch {}
        try {
          const curs: OptionDTO[] = await listCurricula();
          curOptsLoaded = curs.map((c) => ({ value: c.id, label: c.name }));
        } catch {}

        // 2) โหลดรายละเอียดคอร์ส
        const c: any = await getCourse(courseId);
        console.log("🔍 Course data from API:", c);
        console.log("🔍 Full API response keys:", Object.keys(c));
        console.log("🏷️ All category-related fields:", {
          category_id: c.category_id,
          category: c.category,
          category_name: c.category_name,
          category_label: c.category_label,
          category_obj: c.category,
        });
        console.log("🎓 All curriculum-related fields:", {
          curriculum_id: c.curriculum_id,
          curriculum: c.curriculum,
          curriculum_name: c.curriculum_name,
          curriculum_obj: c.curriculum,
        });
        console.log("🔢 All code-related fields:", {
          enroll_token: c.enroll_token,
          code: c.code,
          course_code: c.course_code,
        });

        // 3) ค่าจาก BE → ฟอร์ม (ปรับตามที่เห็นจาก log)
        const currentCategoryId =
          c.category ?? c.category_id ?? c.category?.id ?? "";
        const currentCategoryName =
          c.category_name ?? c.category?.name ?? c.category?.title ?? undefined;

        const currentCurriculumId =
          c.curriculum_id ?? c.curriculum?.id ?? c.curriculum ?? "";
        const currentCurriculumName =
          c.curriculum_name ??
          c.curriculum?.name ??
          c.curriculum?.title ??
          undefined;

        // ดึงค่ารหัสคอร์ส
        const courseCode = c.enroll_token ?? c.code ?? c.course_code ?? "";

        console.log("📋 Mapped values:", {
          currentCategoryId,
          currentCategoryName,
          currentCurriculumId,
          currentCurriculumName,
          courseCode,
        });

        // 4) อัปเดต options ให้มีตัวที่เลือกอยู่เสมอ (ถ้าไม่อยู่ก็ push เข้าไป)
        const ensureIn = (
          opts: ComboboxOption[],
          id?: string | number,
          name?: string
        ) => {
          if (!id) return opts;
          const vid = String(id); // ✅ ประกาศให้ชัด
          const exists = opts.some((o) => o.value === vid);
          if (!exists) {
            return [
              ...opts,
              { value: vid, label: name ? String(name) : `#${vid}` },
            ]; // ✅ ใช้ vid ที่ประกาศ
          }
          return opts;
        };

        catOptsLoaded = ensureIn(
          catOptsLoaded,
          currentCategoryId,
          currentCategoryName
        );
        curOptsLoaded = ensureIn(
          curOptsLoaded,
          currentCurriculumId,
          currentCurriculumName
        );

        console.log("📋 Category options after ensureIn:", catOptsLoaded);
        console.log("📋 Curriculum options after ensureIn:", curOptsLoaded);

        setCatOpts(catOptsLoaded);
        setCurOpts(curOptsLoaded);

        // 5) เติมค่าเดิมลงฟอร์มทั้งหมด
        const formDataValues = {
          name: c.title ?? "",
          description: c.description ?? "",
          category: currentCategoryId ? String(currentCategoryId) : "",
          code: courseCode, // ใช้ค่าที่ map แล้ว
          curriculum: currentCurriculumId ? String(currentCurriculumId) : "",
        };
        console.log("📝 Setting form data:", formDataValues);
        setFormData(formDataValues);

        // 6) รูปปกเดิม (ถ้า BE ส่งชื่อ field ต่าง ให้ใส่ตามนี้)
        setImagePreview(
          c.banner_img || c.banner_image_url || c.image || c.thumbnail || null
        );

        // Normalize status to lowercase และแมปเป็น approval status
        const normalizedStatus = (c.status || '').toLowerCase();
        let mappedApprovalStatus: "approved" | "pending" | "rejected" | "" = "";
        
        if (normalizedStatus === 'active') {
          mappedApprovalStatus = 'approved';
        } else if (normalizedStatus === 'pending') {
          mappedApprovalStatus = 'pending';
        } else if (normalizedStatus === 'denied') {
          mappedApprovalStatus = 'rejected';
        }
        
        setApprovalStatus(mappedApprovalStatus);
        setStatus(
          mapApiStatusToThai(c.visibility || "OPEN") as "เปิด" | "ปิด" | "ซ่อน"
        );

        setHasBeenEdited(false);
      } catch (e) {
        console.error(e);
        toast.error("โหลดข้อมูลคอร์สไม่สำเร็จ");
      }
    })();
  }, [searchParams]);

  // ปุ่มย้อนกลับ: ถ้ามีการแก้ไขยังไม่บันทึกให้เตือน และพยายามย้อนกลับฉลาด ๆ
  const smartBack = () => {
    // เตือนถ้าแก้ไขแล้วแต่ยังไม่บันทึก
    if (isEditing && hasBeenEdited) {
      const ok = window.confirm(
        "มีการแก้ไขที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?"
      );
      if (!ok) return;
    }

    // 1) รองรับ query ?from=/path หรือ ?returnTo=/path
    const from = searchParams.get("from") || searchParams.get("returnTo");
    if (from) {
      try {
        const url = decodeURIComponent(from);
        // กัน open-redirect: อนุญาตเฉพาะ path ภายในโดเมนเรา
        if (url.startsWith("/")) return router.push(url);
      } catch {}
    }

    // 2) ถ้ามี history → ถอยหลัง
    if (typeof window !== "undefined" && window.history.length > 1) {
      return router.back();
    }

    // 3) ใช้ referrer ถ้าเป็นโดเมนเดียวกัน
    const ref = document.referrer;
    if (ref) {
      const refUrl = new URL(ref);
      if (refUrl.origin === window.location.origin) {
        return router.push(`${refUrl.pathname}${refUrl.search}${refUrl.hash}`);
      }
    }

    // 4) fallback ท้ายสุด
    router.push("/my-courses");
  };

  // handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!hasBeenEdited) setHasBeenEdited(true);
    const { name, value } = e.target;
    if (name === "code") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  const handleComboboxChange = (name: string, value: string) => {
    if (!hasBeenEdited) setHasBeenEdited(true);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasBeenEdited) setHasBeenEdited(true);
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  };

  const handleEditSaveToggle = async () => {
    const courseId = searchParams.get("id");
    if (!courseId) return;

    if (isEditing) {
      // ✅ validate
      const newErrors: { [key: string]: string } = {};
      if (!formData.name.trim()) newErrors.name = "กรุณากรอกชื่อคอร์ส";
      if (!formData.description.trim())
        newErrors.description = "กรุณากรอกคำอธิบายคอร์ส";
      if (formData.code.length !== 6) newErrors.code = "รหัสคอร์สต้องมี 6 หลัก";

      setErrors(newErrors);
      if (Object.keys(newErrors).length > 0) return; // ❌ มี error → หยุด ไม่ส่งต่อ

      if (!imagePreview) {
        toast.error("กรุณาอัปโหลดภาพหน้าปกคอร์ส");
        return;
      }
      if (formData.code.length !== 6) {
        toast.error("รหัสคอร์สเรียนต้องเป็นตัวเลข 6 หลัก");
        return;
      }
      const formEl = document.querySelector("form") as HTMLFormElement | null;
      if (formEl && !formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      try {
        if (imageFile) {
          const fd = new FormData();
          fd.append("title", formData.name);
          fd.append("description", formData.description);
          if (formData.curriculum)
            fd.append("curriculum_id", formData.curriculum);
          if (formData.category) fd.append("category_id", formData.category);
          fd.append("enroll_token", formData.code);
          const apiStatus = mapThaiStatusToApi(status);
          if (apiStatus) {
            fd.append("status", apiStatus); // ตาม COURSE_API_CONFIG ใน api.ts
          }
          fd.append("banner_img", imageFile); // เปลี่ยนชื่อฟิลด์ตาม BE ได้
          await updateCourse(courseId, fd);
        } else {
          await updateCourse(courseId, {
            title: formData.name,
            description: formData.description,
            curriculum_id: formData.curriculum || null,
            category_id: formData.category || null,
            enroll_token: formData.code,
            //visibility: TH2API_STATUS[status] || "OPEN",
          });
        }
        toast.success("อัปเดตข้อมูลสำเร็จ!");
        setIsEditing(false);
      } catch (e) {
        console.error(e);
        toast.error("บันทึกไม่สำเร็จ");
      }
    } else {
      setIsEditing(true);
      toast("คุณอยู่ในโหมดแก้ไข", { icon: "✍️" });
    }
  };

  const handleDeleteCourse = () => setIsModalOpen(true);

  const confirmDeletion = async () => {
    const courseId = searchParams.get("id");
    if (!courseId) {
      toast.error("ไม่พบ ID ของคอร์ส");
      setIsModalOpen(false);
      return;
    }

    setIsModalOpen(false);
    const tid = toast.loading("กำลังลบคอร์ส...");

    try {
      await deleteCourse(courseId);

      // ✅ ใช้ success แบบเดียวกับตอนบันทึก + เว้นจังหวะก่อนเปลี่ยนหน้า
      toast.success("ลบคอร์สสำเร็จแล้ว", {
        id: tid,
        duration: 2000,
        style: { background: "#F0FDF4", color: "black" },
      });

      setTimeout(() => router.push("/my-courses"), 300); // รอให้แสดง popup เดิมหน้าเดียวกัน
    } catch (e: any) {
      const data = e?.response?.data;
      const msg =
        data?.detail ??
        data?.error ??
        data?.message ??
        e.message ??
        "ลบคอร์สไม่สำเร็จ";
      toast.error(msg, {
        id: tid,
        style: { background: "#FFF1F2", color: "black" },
      });
    }
  };

  const handleReApproval = async () => {
    const courseId = searchParams.get("id");
    if (!courseId) {
      toast.error("ไม่พบ ID ของคอร์ส");
      return;
    }

    const t = toast.loading("กำลังส่งคำขออนุมัติคอร์ส...");
    try {
      await requestCourseApproval(courseId);
      toast.success("ส่งคำขออนุมัติอีกครั้งสำเร็จ", { id: t });
      setTimeout(() => router.push("/my-courses"), 1200);
    } catch (err: any) {
      console.error("Failed to request approval:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "ส่งคำขออนุมัติไม่สำเร็จ";
      toast.error(msg, { id: t });
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleEditSaveToggle();
  };

  const getApprovalStatusDisplay = () => {
    let textTh = 'ไม่ทราบสถานะ';
    let colorClz = 'bg-gray-100 text-gray-500';
    
    if (approvalStatus === 'approved') {
      textTh = 'อนุมัติแล้ว';
      colorClz = 'bg-[#E1FBE6] text-[#16A34A]';
    } else if (approvalStatus === 'pending') {
      textTh = 'รออนุมัติ';
      colorClz = 'bg-yellow-100 text-yellow-600';
    } else if (approvalStatus === 'rejected') {
      textTh = 'ไม่อนุมัติ';
      colorClz = 'bg-[#FEE2E2] text-[#DC2626]';
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-base font-semibold ${colorClz}`}>
        {textTh}
      </span>
    );
  };

  return (
    <>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeletion}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบคอร์สนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
      />

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
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
            loading: { style: { background: "#EFF6FF", color: "black" } },
          }}
        />

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-semibold">คอร์สของฉัน</h1>
            {getApprovalStatusDisplay()}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-4">
            <button
              type="button"
              onClick={smartBack}
              className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold hover:bg-gray-100"
              title="ย้อนกลับ"
            >
              <FaArrowLeft className="inline-block mr-2" />
              ย้อนกลับ
            </button>
            <button
              type="submit"
              className={`w-full sm:w-auto py-3 px-8 rounded-full border-none text-base cursor-pointer font-semibold transition-colors ${
                isEditing
                  ? "bg-[#31E3CB] text-black hover:bg-teal-400"
                  : "bg-[#2F88FC] text-black hover:bg-blue-600"
              }`}
            >
              {isEditing ? "บันทึกการแก้ไข" : "แก้ไขคอร์ส"}
            </button>
            <button
              type="button"
              onClick={handleDeleteCourse}
              disabled={!isEditing}
              className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold cursor-pointer hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <FaTrash className="inline-block mr-2" />
              ลบคอร์ส
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-6">
          <div className="flex flex-col gap-6">
            <div>
              <label className="font-semibold text-xl flex items-center gap-2 mb-2">
                <FaPen /> ชื่อคอร์ส
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="ชื่อคอร์ส"
                disabled={!isEditing}
                data-field-error="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "err-name" : undefined}
                className={`p-3 w-full rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.name
                    ? "border border-red-500 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500"
                    : "border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {errors.name && (
                <p id="err-name" className="mt-1 text-sm text-red-600">
                  {errors.name}
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
                disabled={!isEditing}
                data-field-error="description"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "err-description" : undefined
                }
                className={`p-3 w-full rounded-lg text-sm min-h-[90px] resize-y disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.description
                    ? "border border-red-500 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500"
                    : "border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
              />
              {errors.description && (
                <p id="err-description" className="mt-1 text-sm text-red-600">
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <label className="font-semibold text-xl flex items-center gap-2 mb-2">
                หมวดหมู่คอร์ส
              </label>
              <Combobox
                key={`cat-${formData.category}-${categoryOptions.length}`}
                options={categoryOptions}
                value={formData.category}
                onChange={(v) => handleComboboxChange("category", v)}
                placeholder="เลือกหรือค้นหาหมวดหมู่"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-start">
            <label className="font-semibold text-xl flex items-center gap-2 mb-2 w-full lg:sr-only">
              ภาพหน้าปกคอร์ส
            </label>
            <div
              className={`w-full aspect-video border border-gray-300 rounded-2xl flex flex-col items-center justify-center text-sm text-gray-600 font-bold overflow-hidden ${
                !isEditing
                  ? "cursor-not-allowed bg-gray-100"
                  : "cursor-pointer bg-white hover:bg-gray-50"
              }`}
              onClick={() =>
                isEditing && document.getElementById("uploadInput")?.click()
              }
            >
              {imagePreview ? (
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
                accept="image/*"
                id="uploadInput"
                className="hidden"
                onChange={handleImageChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

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
              disabled={!isEditing}
              data-field-error="code"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "err-code" : undefined}
              className={`p-3 w-full rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.code
                  ? "border border-red-500 text-red-900 placeholder-red-400 focus:ring-red-500 focus:border-red-500"
                  : "border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
            />
            {errors.code && (
              <p id="err-code" className="mt-1 text-sm text-red-600">
                {errors.code}
              </p>
            )}
          </div>
          <div>
            <label className="font-semibold text-xl flex items-center gap-2 mb-2">
              <FaFileAlt /> หลักสูตร
            </label>
            <Combobox
              key={`cur-${formData.curriculum}-${curriculumOptions.length}`}
              options={curriculumOptions}
              value={formData.curriculum}
              onChange={(v) => handleComboboxChange("curriculum", v)}
              placeholder="เลือกหรือค้นหาหลักสูตร"
              disabled={!isEditing}
            />
          </div>
        </div>

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
                  setStatus(e.target.value as any);
                  if (!hasBeenEdited) setHasBeenEdited(true);
                }}
                disabled={!isEditing}
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
                  setStatus(e.target.value as any);
                  if (!hasBeenEdited) setHasBeenEdited(true);
                }}
                disabled={!isEditing}
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
                  setStatus(e.target.value as any);
                  if (!hasBeenEdited) setHasBeenEdited(true);
                }}
                disabled={!isEditing}
              />{" "}
              ซ่อน
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
          {approvalStatus === "rejected" ? (
            <button
              type="button"
              className="w-full sm:w-auto py-3 px-8 bg-yellow-500 text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-yellow-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={handleReApproval}
              disabled={!hasBeenEdited || isEditing}
              title={
                !hasBeenEdited
                  ? "กรุณาแก้ไขและบันทึกข้อมูลก่อนส่งขออนุมัติอีกครั้ง"
                  : "ส่งขออนุมัติอีกครั้ง"
              }
            >
              <FaSync className="inline-block mr-2" />
              ขออนุมัติอีกครั้ง
            </button>
          ) : (
            <>
              <button
                type="button"
                className="w-full sm:w-auto py-3 px-8 bg-[#31E3CB] text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-teal-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                onClick={() => {
                  const id = searchParams.get("id");
                  if (id) router.push(`/edit-lesson?id=${id}`);
                  else toast.error("ไม่พบ ID ของคอร์ส");
                }}
                disabled={isEditing}
                title={isEditing ? "กรุณาบันทึกการแก้ไขก่อน" : "จัดการบทเรียน"}
              >
                จัดการบทเรียน
              </button>
              <button
                type="button"
                className="w-full sm:w-auto py-3 px-8 bg-[#31E3CB] text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-teal-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                onClick={() => {
                  const id = searchParams.get("id");
                  if (id) router.push(`/edit-quiz?courseId=${id}`);
                  else toast.error("ไม่พบ ID ของคอร์สสำหรับจัดการบททดสอบ");
                }}
                disabled={isEditing}
                title={isEditing ? "กรุณาบันทึกการแก้ไขก่อน" : "จัดการแบบทดสอบ"}
              >
                จัดการแบบทดสอบ
              </button>
            </>
          )}
        </div>
      </form>
    </>
  );
};

export default EditCoursePage;
