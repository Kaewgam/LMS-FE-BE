"use client";

import React, { useState, useMemo, useRef, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaPlus,
  FaChevronDown,
  FaTrash,
  FaExclamationTriangle,
  FaTimes,
  FaPen,
  FaSave,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import api, { listCategories, toAbsMedia } from "@/lib/api";

const UNIVERSITY_ID =
  process.env.NEXT_PUBLIC_UNIVERSITY_ID || process.env.NEXT_PUBLIC_UNI_ID || "";

// --- Types ---
interface Option {
  value: string | number;
  label: string;
}

interface StudentOption {
  id: string;
  name: string;
}

interface Student {
  key: number;
  id: string;
  name: string;
  // สำหรับเรียก DELETE /members/{enrollment_id}/
  enrollmentId?: string;
}

// =============================
// Combobox แบบเดิม
// =============================
interface ComboboxProps {
  label: string;
  options: Option[];
  selectedValue: Option | null;
  onChange: (value: Option | null) => void;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
}
const Combobox: React.FC<ComboboxProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder,
  isRequired,
  disabled,
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [searchQuery, options]);

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
        className="w-full p-3 pr-10 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
        required={isRequired && !selectedValue}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => !disabled && setIsOptionsOpen(!isOptionsOpen)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        <FaChevronDown />
      </button>
      {isOptionsOpen && !disabled && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option);
                  setSearchQuery(option.label);
                  setIsOptionsOpen(false);
                }}
                className="p-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
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

// =============================
// Modal ยืนยัน
// =============================
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
  const isDeleteAction = title.includes("ลบ");
  const confirmButtonColor = isDeleteAction
    ? "bg-red-600 hover:bg-red-700"
    : "bg-blue-600 hover:bg-blue-700";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
                 bg-black/40 backdrop-blur-[1px]"
    >
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
            className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor}`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================
// Main: EditCoursePage
// =============================
const EditCoursePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  // --- state หลัก ---
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseCode, setCourseCode] = useState(""); // ใช้กับ enroll_token


  // dropdown options จาก API
  const [syllabusOptions, setSyllabusOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [hasCategoryField, setHasCategoryField] = useState(false);

  // ค่า selected
  const [selectedSyllabus, setSelectedSyllabus] = useState<Option | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Option | null>(
    null
  );

  // ผู้เรียน / Enrollment
  const [allStudentsData, setAllStudentsData] = useState<StudentOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<Option | null>(
    null
  );
  const [selectedStudentName, setSelectedStudentName] = useState<Option | null>(
    null
  );
  const [nextStudentKey, setNextStudentKey] = useState(1);

  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // =============================
  // ดึง dropdown options: Curriculum & Category
  // =============================
  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const curriculumPath =
          (process.env.NEXT_PUBLIC_CURRICULUMS_PATH || "").trim() ||
          (UNIVERSITY_ID
            ? `/api/universities/${UNIVERSITY_ID}/curriculums/`
            : "/api/curriculums/");

        let curRes;
        try {
          curRes = await api.get(curriculumPath);
        } catch (err) {
          console.warn("[EditCourse] curriculum fetch fallback:", err);
          curRes = await api.get("/api/curricula/");
        }

        const curList = Array.isArray(curRes.data)
          ? curRes.data
          : curRes.data?.results ?? [];

        setSyllabusOptions(
          curList.map((c: any) => ({
            value: c.id,
            label: c.name ?? "ไม่ทราบชื่อหลักสูตร",
          }))
        );

        try {
          const cats = await listCategories();
          setCategoryOptions(
            cats.map((c) => ({
              value: c.id,
              label: c.name ?? "",
            }))
          );
          setHasCategoryField(true);
        } catch (catErr) {
          console.warn("[EditCourse] category fetch fallback -> none:", catErr);
          setCategoryOptions([]);
          setHasCategoryField(false);
          setSelectedCategory(null);
        }
      } catch (err) {
        console.error("[EditCourse] dropdown fetch error:", err);
        // ไม่ toast ก็ได้เพื่อไม่ให้รก
      }
    }
    fetchDropdowns();
  }, []);

  // =============================
  // helper: โหลดรายชื่อผู้เรียนทั้งหมด + enrollment ของคอร์ส
  // =============================
  const loadStudentsForCourse = async (courseIdValue: string) => {
    try {
      // 1) โหลดรายชื่อผู้เรียนทั้งหมด (จาก User โดยตรง)
      const studentsRes = await api.get(`/api/students/`);

      const allStudentList: any[] = Array.isArray(studentsRes.data)
        ? studentsRes.data
        : studentsRes.data?.results ?? [];

      // ตั้งค่ารายชื่อทั้งหมดไว้ใน Combobox
      setAllStudentsData(
        allStudentList.map((u: any) => ({
          id: u.id,
          name: u.full_name ?? u.email ?? u.name ?? "ไม่ทราบชื่อผู้เรียน",
        }))
      );

      // 2) โหลดผู้เรียนเฉพาะที่อยู่ในคอร์สนี้
      const enrollRes = await api.get(
        `/api/courses/${courseIdValue}/members/`,
        { params: { university_id: UNIVERSITY_ID } }
      );

      const enrollRaw: any = enrollRes.data ?? [];
      const enrollmentList = Array.isArray(enrollRaw)
        ? enrollRaw
        : enrollRaw.results ?? [];

      // ผู้เรียนในคอร์สปัจจุบัน
      setStudents(
        enrollmentList.map((en: any, index: number) => ({
          key: index + 1,
          id: en.student?.id ?? "",
          name:
            en.student?.full_name ?? en.student?.email ?? "ไม่ทราบชื่อผู้เรียน",
          enrollmentId: en.id,
        }))
      );

      setNextStudentKey(enrollmentList.length + 1);
    } catch (err) {
      console.error("[EditCourse] load students error:", err);
      setAllStudentsData([]);
      setStudents([]);
      setNextStudentKey(1);
    }
  };

  // =============================
  // โหลดข้อมูลคอร์สจาก API ตาม ?id=...
  // =============================
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (!idFromUrl) {
      toast.error("ไม่พบ ID คอร์สที่ต้องการแก้ไข");
      router.push("/universities-staff/management-course");
      return;
    }

    const safeCourseId: string = idFromUrl;
    setCourseId(safeCourseId);

    async function fetchCourse() {
      try {
        setLoading(true);
        const res = await api.get(`/api/courses/${idFromUrl}/`, {
          params: { university_id: UNIVERSITY_ID },
        });
        const data = res.data;

        setCourseName(data.title ?? "");
        setCourseDescription(data.description ?? "");
        setCoverImagePreview(toAbsMedia(data.banner_img) ?? null);

        // instructor แสดงเป็น read-only อย่างเดียว
        if (data.instructor_name) {
          setSelectedInstructor({
            value: data.instructor,
            label: data.instructor_name,
          });
        } else {
          setSelectedInstructor(null);
        }

        // curriculum
        const curriculumId = data.curriculum ?? data.curriculum_id;
        if (curriculumId && data.curriculum_name) {
          setSelectedSyllabus({
            value: curriculumId,
            label: data.curriculum_name,
          });
        } else {
          setSelectedSyllabus(null);
        }

        const categoryId = data.category ?? data.category_id;
        if (categoryId && data.category_name) {
          setSelectedCategory({
            value: categoryId,
            label: data.category_name,
          });
          setHasCategoryField(true);
        } else {
          setSelectedCategory(null);
        }

        setCourseCode(data.enroll_token ?? "");


        // โหลดผู้เรียนจริงจาก Enrollment
        await loadStudentsForCourse(safeCourseId);
      } catch (err) {
        console.error("[EditCourse] fetch course error:", err);
        toast.error("ไม่พบข้อมูลคอร์สที่ต้องการแก้ไข");
        router.push("/universities-staff/management-course");
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [searchParams, router]);

  // =============================
  // ตัวช่วยด้านผู้เรียน
  // =============================
  const studentIdOptions = useMemo(() => {
    const addedStudentIds = new Set(students.map((s) => s.id));
    return allStudentsData
      .filter((student) => !addedStudentIds.has(student.id))
      .map((student) => ({ value: student.id, label: student.id }));
  }, [students, allStudentsData]);

  const studentNameOptions = useMemo(() => {
    const addedStudentNames = new Set(students.map((s) => s.name));
    return allStudentsData
      .filter((student) => !addedStudentNames.has(student.name))
      .map((student) => ({ value: student.name, label: student.name }));
  }, [students, allStudentsData]);

  const handleSelectStudentId = (option: Option | null) => {
    setSelectedStudentId(option);
    if (option) {
      const matchedStudent = allStudentsData.find((s) => s.id === option.value);
      if (matchedStudent) {
        setSelectedStudentName({
          value: matchedStudent.name,
          label: matchedStudent.name,
        });
      } else {
        setSelectedStudentName(null);
      }
    } else {
      setSelectedStudentName(null);
    }
  };

  const handleSelectStudentName = (option: Option | null) => {
    setSelectedStudentName(option);
    if (option) {
      const matchedStudent = allStudentsData.find(
        (s) => s.name === option.value
      );
      if (matchedStudent) {
        setSelectedStudentId({
          value: matchedStudent.id,
          label: matchedStudent.id,
        });
      } else {
        setSelectedStudentId(null);
      }
    } else {
      setSelectedStudentId(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddStudent = async () => {
    const studentId = selectedStudentId?.value.toString().trim();
    const studentName = selectedStudentName?.value.toString().trim();

    if (!courseId) {
      toast.error("ไม่พบ ID คอร์ส");
      return;
    }

    if (studentId && studentName) {
      if (students.some((student) => student.id === studentId)) {
        toast.error(`ผู้เรียน ID: ${studentId} ถูกเพิ่มไปแล้ว`);
        return;
      }
      const isValidStudent = allStudentsData.some(
        (s) => s.id === studentId && s.name === studentName
      );
      if (!isValidStudent) {
        toast.error(
          "ID และชื่อผู้เรียนไม่ตรงกัน หรือไม่พบข้อมูลในระบบ กรุณาเลือกจากรายการที่มีอยู่"
        );
        return;
      }

      const toastId = toast.loading("กำลังเพิ่มผู้เรียนเข้าคอร์ส...");
      try {
        const res = await api.post(
          `/api/courses/${courseId}/members/`,
          { student_id: studentId },
          { params: { university_id: UNIVERSITY_ID } }
        );
        const created = res.data;

        setStudents([
          ...students,
          {
            key: nextStudentKey,
            id: studentId,
            name: studentName,
            enrollmentId: created?.id,
          },
        ]);
        setNextStudentKey(nextStudentKey + 1);
        setSelectedStudentId(null);
        setSelectedStudentName(null);
        toast.success(`เพิ่มผู้เรียน ${studentName} สำเร็จ!`, {
          id: toastId,
        });
      } catch (err) {
        console.error("[EditCourse] add student error:", err);
        toast.error("ไม่สามารถเพิ่มผู้เรียนเข้าคอร์สได้", { id: toastId });
      }
    } else {
      toast.error("กรุณาเลือกหรือกรอกทั้ง ID และชื่อผู้เรียนให้ถูกต้อง");
    }
  };

  const openConfirmationModal = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });
  };

  const handleConfirmDeleteStudent = (
    keyToDelete: number,
    studentName: string,
    enrollmentId?: string
  ) => {
    openConfirmationModal(
      "ยืนยันการลบผู้เรียน",
      `คุณแน่ใจหรือไม่ว่าต้องการลบผู้เรียน "${studentName}" ออกจากคอร์สนี้?`,
      async () => {
        if (!courseId || !enrollmentId) {
          // ถ้าไม่มี enrollmentId ให้ลบแค่ฝั่ง UI
          setStudents(
            students.filter((student) => student.key !== keyToDelete)
          );
          closeConfirmationModal();
          toast.success(`ลบผู้เรียน "${studentName}" เรียบร้อยแล้ว`);
          return;
        }

        const toastId = toast.loading("กำลังลบผู้เรียนออกจากคอร์ส...");
        try {
          await api.delete(
            `/api/courses/${courseId}/members/${enrollmentId}/`,
            { params: { university_id: UNIVERSITY_ID } }
          );
          setStudents(
            students.filter((student) => student.key !== keyToDelete)
          );
          closeConfirmationModal();
          toast.success(`ลบผู้เรียน "${studentName}" เรียบร้อยแล้ว`, {
            id: toastId,
          });
        } catch (err) {
          console.error("[EditCourse] delete student error:", err);
          toast.error("ไม่สามารถลบผู้เรียนออกจากคอร์สได้", { id: toastId });
        }
      }
    );
  };

  // =============================
  // Edit / Save / Delete course (API)
  // =============================
  const handleEditSaveToggle = () => {
    if (loading) return;
    if (isEditing) {
      formRef.current?.requestSubmit();
    } else {
      setIsEditing(true);
      toast("คุณอยู่ในโหมดแก้ไข", { icon: "✍️" });
    }
  };

  const handleDeleteCourse = () => {
    if (!courseId) return;
    openConfirmationModal(
      "ยืนยันการลบคอร์ส",
      `คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "${courseName}" (ID: ${courseId})? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        const toastId = toast.loading("กำลังลบคอร์ส...");
        try {
          await api.delete(`/api/courses/${courseId}/`, {
            params: { university_id: UNIVERSITY_ID },
          });
          toast.success("ลบคอร์สสำเร็จแล้ว", { id: toastId });
          closeConfirmationModal();
          router.push("/universities-staff/management-course");
        } catch (err) {
          console.error("[EditCourse] delete error:", err);
          toast.error("ไม่สามารถลบคอร์สได้", { id: toastId });
          closeConfirmationModal();
        }
      }
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast.error("ไม่พบ ID คอร์ส");
      return;
    }

    if (!courseName.trim()) {
      toast.error("กรุณากรอกชื่อคอร์ส");
      return;
    }

    const toastId = toast.loading("กำลังบันทึกข้อมูลคอร์ส...");

    try {
      const formData = new FormData();
      formData.append("title", courseName);
      formData.append("description", courseDescription);

      if (coverImage) {
        formData.append("banner_img", coverImage);
      }

      if (selectedSyllabus?.value) {
        formData.append("curriculum", String(selectedSyllabus.value));
      }

      if (hasCategoryField && selectedCategory?.value) {
        formData.append("category_id", String(selectedCategory.value));
      }

      if (courseCode) {
        formData.append("enroll_token", courseCode);
      }

      // NOTE: ฟิลด์ enabled/status จะไม่ได้อัปเดตจากหน้านี้ (ใช้ endpoint update-status แยก)
      await api.patch(`/api/courses/${courseId}/`, formData, {
        params: { university_id: UNIVERSITY_ID },
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("อัปเดตข้อมูลคอร์สสำเร็จ!", { id: toastId });
      setIsEditing(false);
    } catch (err: any) {
      console.error("[EditCourse] update error:", err);
      const detail =
        err?.response?.data?.detail ??
        "ไม่สามารถอัปเดตข้อมูลคอร์สได้ กรุณาลองใหม่อีกครั้ง";
      toast.error(detail, { id: toastId });
    }
  };



  // instructor combobox ให้มี options แค่ตัวเอง (read-only)
  const instructorOptions: Option[] = selectedInstructor
    ? [selectedInstructor]
    : [];

  // =============================
  // Render
  // =============================
  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white text-lg">กำลังโหลดข้อมูลคอร์ส...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: "8px",
            fontSize: "16px",
            padding: "16px 24px",
            fontWeight: 600,
          },
          success: { style: { background: "#F0FDF4", color: "black" } },
          error: { style: { background: "#FFF1F2", color: "black" } },
          loading: { style: { background: "#EFF6FF", color: "black" } },
        }}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-end">
          <h1 className="text-2xl sm:text-2xl font-semibold mb-4 sm:mb-0">
            แก้ไขคอร์ส
          </h1>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={handleEditSaveToggle}
              className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
                isEditing
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isEditing ? (
                <>
                  <FaSave /> บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <FaPen /> แก้ไขคอร์ส
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteCourse}
              disabled={!isEditing}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FaTrash /> ลบคอร์ส
            </button>
          </div>
        </div>



        {/* ฟอร์มแก้ไข */}
        <div className="bg-gray-700 rounded-xl shadow-lg p-6 sm:p-8">
          <form
            onSubmit={handleSubmit}
            id="edit-course-form"
            ref={formRef}
            className="space-y-10"
          >
            {/* cover image */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-2 md:gap-x-4 items-start">
              <label className="text-white font-semibold whitespace-nowrap pt-3">
                หน้าปกคอร์ส
              </label>
              <div className="flex flex-col items-start space-y-3">
                <label
                  htmlFor="cover-image-upload"
                  className={`relative flex items-center justify-center w-full max-w-[540px] aspect-video rounded-lg border-2 border-dashed border-gray-400 cursor-pointer hover:border-blue-400 transition-colors bg-white overflow-hidden ${
                    !isEditing ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  {coverImagePreview ? (
                    <img
                      src={coverImagePreview}
                      alt="Course Cover"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <FaPlus size={24} className="mx-auto mb-2" />
                      <span className="font-semibold">อัปโหลดภาพหน้าปก</span>
                    </div>
                  )}
                  <input
                    id="cover-image-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={!isEditing}
                    ref={fileInputRef}
                  />
                </label>
                <p className="text-sm mt-2 text-white">
                  เฉพาะไฟล์ png , jpg , jpeg
                </p>
              </div>
            </div>

            {/* ชื่อคอร์ส */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
              <label
                htmlFor="course-name"
                className="text-white font-semibold whitespace-nowrap"
              >
                ชื่อคอร์ส
              </label>
              <input
                type="text"
                id="course-name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="p-3 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="กรอกชื่อคอร์ส"
                required
                disabled={!isEditing}
              />
            </div>

            {/* ผู้สอน (read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
              <label className="text-white font-semibold whitespace-nowrap">
                ชื่อผู้สอน
              </label>
              <Combobox
                label="ชื่อผู้สอน"
                options={instructorOptions}
                selectedValue={selectedInstructor}
                onChange={() => {}}
                placeholder="ชื่อผู้สอน"
                isRequired
                disabled={true} // แสดงอ่านอย่างเดียว
              />
            </div>

            {/* คำอธิบาย */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
              <label
                htmlFor="course-description"
                className="text-white font-semibold pt-2 whitespace-nowrap"
              >
                คำอธิบายคอร์ส
              </label>
              <textarea
                id="course-description"
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                rows={4}
                className="p-3 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 resize-y disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="กรอกคำอธิบายเกี่ยวกับคอร์ส"
                required
                disabled={!isEditing}
              ></textarea>
            </div>

            {/* หลักสูตร */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
              <label
                htmlFor="syllabus"
                className="text-white font-semibold whitespace-nowrap"
              >
                หลักสูตร
              </label>
              <Combobox
                label="หลักสูตร"
                options={syllabusOptions}
                selectedValue={selectedSyllabus}
                onChange={setSelectedSyllabus}
                placeholder="กรุณาเลือก หรือ พิมพ์เพื่อค้นหา..."
                isRequired
                disabled={!isEditing || !hasCategoryField}
              />
            </div>

            {/* หมวดหมู่ */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
              <label
                htmlFor="category"
                className="text-white font-semibold whitespace-nowrap"
              >
                หมวดหมู่คอร์ส
              </label>
              <Combobox
                label="หมวดหมู่คอร์ส"
                options={categoryOptions}
                selectedValue={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="กรุณาเลือก หรือ พิมพ์เพื่อค้นหา..."
                isRequired={hasCategoryField}
                disabled={!isEditing || !hasCategoryField}
              />
            </div>

            {/* รหัสคอร์ส (enroll_token) */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
              <label
                htmlFor="course-code"
                className="text-white font-semibold whitespace-nowrap"
              >
                รหัสคอร์ส
              </label>
              <input
                type="text"
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="p-3 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="กรอกรหัสคอร์ส (ตัวเลข 6 หลัก)"
                required
                disabled={!isEditing}
              />
            </div>

            {/* จัดการผู้เรียน (เชื่อม API แล้ว) */}
            <div>
              <h3 className="text-white font-semibold mb-4">จัดการผู้เรียน</h3>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] items-center gap-4 mb-4">
                <div className="w-full">
                  <Combobox
                    label="ID ผู้เรียน"
                    options={studentIdOptions}
                    selectedValue={selectedStudentId}
                    onChange={handleSelectStudentId}
                    placeholder="รหัสประจำตัวผู้เรียน"
                    disabled={!isEditing}
                  />
                </div>
                <div className="w-full">
                  <Combobox
                    label="ชื่อผู้เรียน"
                    options={studentNameOptions}
                    selectedValue={selectedStudentName}
                    onChange={handleSelectStudentName}
                    placeholder="กรอกชื่อผู้เรียน"
                    disabled={!isEditing}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddStudent}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-200 rounded-lg text-black font-semibold transition-colors w-full lg:w-auto disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!isEditing}
                >
                  <FaPlus className="inline" /> เพิ่มผู้เรียน
                </button>
              </div>

              <div className="bg-white rounded-lg overflow-hidden">
                {/* desktop table */}
                <div className="hidden sm:block">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                      <tr>
                        <th className="px-6 py-3 w-1/12 text-center border border-gray-200">
                          #
                        </th>
                        <th className="px-6 py-3 w-4/12 text-center border border-gray-200">
                          รหัสประจำตัวผู้เรียน
                        </th>
                        <th className="px-6 py-3 w-4/12 text-center border border-gray-200">
                          ชื่อ
                        </th>
                        <th className="px-6 py-3 w-3/12 text-center border border-gray-200">
                          การจัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length > 0 ? (
                        students.map((student, index) => (
                          <tr key={student.key} className="text-gray-800">
                            <td className="px-6 py-4 font-medium whitespace-nowrap text-center border border-gray-200">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 text-center border border-gray-200">
                              {student.id}
                            </td>
                            <td className="px-6 py-4 text-center border border-gray-200">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 text-center border border-gray-200">
                              <div className="flex justify-center items-stretch">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleConfirmDeleteStudent(
                                      student.key,
                                      student.name,
                                      student.enrollmentId
                                    )
                                  }
                                  disabled={!isEditing}
                                  className="flex-1 flex items-center justify-center font-medium text-gray-800 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                  <FaTrash className="mr-1" />
                                  ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-gray-500 border border-gray-200"
                          >
                            ยังไม่ได้เพิ่มผู้เรียน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* mobile cards */}
                <div className="sm:hidden space-y-3 p-4">
                  {students.length > 0 ? (
                    students.map((student, index) => (
                      <div
                        key={student.key}
                        className="rounded-lg p-3 text-sm shadow border border-gray-300 bg-white text-gray-800"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">{`#${index + 1} ${
                            student.name
                          }`}</span>
                          <span className="text-xs">ID: {student.id}</span>
                        </div>
                        <div className="flex justify-end items-center border-t pt-2 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleConfirmDeleteStudent(
                                student.key,
                                student.name,
                                student.enrollmentId
                              )
                            }
                            disabled={!isEditing}
                            className="flex items-center justify-center font-medium text-gray-800 hover:text-red-600 text-sm pl-3 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <FaTrash className="mr-1" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 p-4">
                      ยังไม่ได้เพิ่มผู้เรียน
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCoursePage;
