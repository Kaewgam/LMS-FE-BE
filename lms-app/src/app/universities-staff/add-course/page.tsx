"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FaPlus,
  FaChevronDown,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";

const UNIVERSITY_ID =
  process.env.NEXT_PUBLIC_UNIVERSITY_ID || process.env.NEXT_PUBLIC_UNI_ID || "";

// --- Data ---
interface Option {
  value: string | number;
  label: string;
}

interface ComboboxProps {
  options: Option[];
  selectedValue: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isRequired?: boolean;
}

// ------------------ Combobox Component ------------------
const Combobox: React.FC<ComboboxProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder,
  isRequired,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    selectedValue ? selectedValue.label : ""
  );
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(selectedValue ? selectedValue.label : "");
  }, [selectedValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={comboboxRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          onChange(null);
          if (!isOptionsOpen) setIsOptionsOpen(true);
        }}
        onFocus={() => setIsOptionsOpen(true)}
        className="w-full p-3 pr-10 rounded-lg bg-white border border-gray-300"
        required={isRequired && !selectedValue}
      />
      <button
        type="button"
        onClick={() => setIsOptionsOpen(!isOptionsOpen)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <FaChevronDown />
      </button>
      {isOptionsOpen && (
        <ul className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-y-auto">
          {filtered.length ? (
            filtered.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option);
                  setSearchQuery(option.label);
                  setIsOptionsOpen(false);
                }}
                className="p-3 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {option.label}
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

// ------------------ Confirmation Modal ------------------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-500" />
            {title}
          </h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded">
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-blue-600 text-white rounded"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// ---------------------- MAIN PAGE ------------------------------
// ---------------------------------------------------------------
const AddCoursePage: React.FC = () => {
  const router = useRouter();

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );

  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedSyllabus, setSelectedSyllabus] = useState<Option | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Option | null>(
    null
  );
  const [courseCode, setCourseCode] = useState("");


  const [instructorOptions, setInstructorOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [syllabusOptions, setSyllabusOptions] = useState<Option[]>([]);

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // ------------------ LOAD OPTIONS ------------------
  useEffect(() => {
  const loadOptions = async () => {
    try {
      // ดึงผู้สอนทั้งหมด (ไม่ส่ง university แล้ว)
      const instRes = await api.get("/api/instructors/");
      const instructors = instRes.data as { id: string; name: string }[];

      setInstructorOptions(
        instructors.map((inst) => ({
          value: inst.id,
          label: inst.name,
        }))
      );

      // โหลด categories
      const catRes = await api.get("/api/categories/");
      const cats = catRes.data as any[];
      setCategoryOptions(
        cats.map((c) => ({
          value: c.id,
          label: c.name || c.name_th || c.name_en || "ไม่ทราบชื่อหมวดหมู่",
        }))
      );

      // โหลด curricula (ยังใช้ university id ได้ตามเดิม)
      const curRes = await api.get("/api/curricula/", {
        params: UNIVERSITY_ID ? { university: UNIVERSITY_ID } : {},
      });
      const curs = curRes.data as any[];
      setSyllabusOptions(
        curs.map((cur) => ({
          value: cur.id,
          label:
            cur.name_th ||
            cur.name ||
            cur.name_en ||
            cur.code ||
            "ไม่ทราบชื่อหลักสูตร",
        }))
      );
    } catch (err) {
      console.error("[AddCourse] load options error:", err);
      toast.error("โหลดข้อมูลตัวเลือกไม่สำเร็จ");
    }
  };

  loadOptions();
}, []);


  // ------------------ HANDLE SUBMIT ------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!coverImage) return toast.error("กรุณาอัปโหลดรูปหน้าปก");
    if (!courseName.trim()) return toast.error("กรอกชื่อคอร์ส");
    if (!selectedInstructor) return toast.error("เลือกผู้สอน");
    if (!courseDescription.trim()) return toast.error("กรอกคำอธิบายคอร์ส");
    if (!selectedSyllabus) return toast.error("เลือกหลักสูตร");
    if (!selectedCategory) return toast.error("เลือกหมวดหมู่");
    if (!/^\d{6}$/.test(courseCode.trim()))
      return toast.error("รหัสคอร์สต้องเป็นตัวเลข 6 หลัก");

    const toastId = toast.loading("กำลังสร้างคอร์ส...");

    try {
      const fd = new FormData();
      fd.append("title", courseName);
      fd.append("description", courseDescription);
      fd.append("level", "beginner");
      fd.append("curriculum", String(selectedSyllabus.value));
      fd.append("instructor", String(selectedInstructor.value));
      fd.append("category_id", String(selectedCategory.value));
      fd.append("enroll_token", courseCode.trim());

      fd.append("banner_img", coverImage);

      if (UNIVERSITY_ID) {
        fd.append("university", UNIVERSITY_ID);
      }

      await api.post("/api/courses/", fd, {
        params: UNIVERSITY_ID ? { university_id: UNIVERSITY_ID } : {},
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("สร้างคอร์สสำเร็จ!", { id: toastId });
      setTimeout(() => {
        router.push("/universities-staff/management-course");
      }, 1000);

    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : "สร้างคอร์สไม่สำเร็จ";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen p-8">
      <Toaster position="top-center" />

      <ConfirmationModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
      />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">สร้างคอร์ส</h1>



        <div className="bg-[#414E51] p-8 rounded-xl shadow-lg">
          <form
            id="add-course-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* --- Cover image --- */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold pt-3">
                หน้าปกคอร์ส
              </label>

              <div>
                <label
                  htmlFor="cover-image-upload"
                  className="relative flex items-center justify-center w-full max-w-[540px] aspect-video bg-white border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:bg-gray-200"
                >
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-500 text-center">
                      <FaPlus size={24} className="mx-auto mb-2" />
                      <span>อัปโหลดภาพหน้าปก</span>
                    </div>
                  )}
                  <input
                    id="cover-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setCoverImage(f);
                        setCoverImagePreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </label>
                <p className="text-sm text-white mt-1">
                  รองรับไฟล์ .jpg .jpeg .png
                </p>
              </div>
            </div>

            {/* --- Name, instructor, description --- */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">ชื่อคอร์ส</label>
              <input
                className="p-3 rounded bg-white border"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">ชื่อผู้สอน</label>
              <Combobox
                options={instructorOptions}
                selectedValue={selectedInstructor}
                onChange={setSelectedInstructor}
                placeholder="เลือกผู้สอน..."
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">คำอธิบายคอร์ส</label>
              <textarea
                className="p-3 rounded bg-white border"
                rows={4}
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                required
              />
            </div>

            {/* --- Curriculum --- */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">หลักสูตร</label>
              <Combobox
                options={syllabusOptions}
                selectedValue={selectedSyllabus}
                onChange={setSelectedSyllabus}
                placeholder="เลือกหลักสูตร..."
                isRequired
              />
            </div>

            {/* --- Category --- */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">หมวดหมู่คอร์ส</label>
              <Combobox
                options={categoryOptions}
                selectedValue={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="เลือกหมวดหมู่..."
                isRequired
              />
            </div>

            {/* --- Enroll token --- */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
              <label className="text-white font-semibold">รหัสคอร์ส</label>
              <input
                className="p-3 rounded bg-white border"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="ตัวเลข 6 หลัก"
                required
              />
            </div>
          </form>
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            form="add-course-form"
            className="px-8 py-3 bg-[#414E51] text-white rounded-lg hover:bg-[#2b3436]"
          >
            บันทึกคอร์ส
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCoursePage;
