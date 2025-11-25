"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { MoreVertical, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaChevronDown, FaArrowLeft } from "react-icons/fa";
import {
  findAssignment,
  type AssignmentDTO,
} from "@/lib/assignmentApi";

/* =========================
 * Combobox Component (เดิม)
 * ========================= */
interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSearchable?: boolean;
}

const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  isSearchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSearchable) {
      setInputValue(value);
    } else {
      const selectedLabel =
        options.find((opt) => opt.value === value)?.label || "";
      setInputValue(selectedLabel);
    }
  }, [value, options, isSearchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (!isSearchable) {
          const selectedLabel =
            options.find((opt) => opt.value === value)?.label || "";
          setInputValue(selectedLabel);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef, value, options, isSearchable]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    if (isSearchable) {
      onChange(text);
    }
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionClick = (option: ComboboxOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const filteredOptions = isSearchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : options;

  return (
    <div className="relative w-full" ref={containerRef}>
      {isSearchable && (
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={15}
        />
      )}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`p-3 w-full border border-gray-300 rounded-lg text-sm ${
          isSearchable ? "pl-10" : "pr-10"
        } bg-white`}
      />
      {!isSearchable && (
        <FaChevronDown className="absolute right-[15px] top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      )}

      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <li
                key={option.value}
                onClick={() => handleOptionClick(option)}
                className="p-3 text-sm hover:bg-gray-100 cursor-pointer"
              >
                {option.label}
              </li>
            ))
          ) : (
            <li className="p-3 text-sm text-gray-600">ไม่พบข้อมูล</li>
          )}
        </ul>
      )}
    </div>
  );
};

/* =========================
 * FileBadge (เหมือนหน้า edit-assignment)
 * ========================= */
function FileBadge(props: { mime?: string | null; name?: string }) {
  const mime = (props.mime || "").toLowerCase();
  const ext = (props.name || "").split(".").pop()?.toLowerCase() ?? "";

  let bg = "bg-slate-700";
  let label = "FILE";

  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif"].includes(ext)
  ) {
    bg = "bg-blue-500";
    label = "IMG";
  } else if (mime === "application/pdf" || ext === "pdf") {
    bg = "bg-red-500";
    label = "PDF";
  } else if (
    mime.includes("spreadsheet") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    bg = "bg-emerald-500";
    label = "XLS";
  } else if (mime.startsWith("video/") || ["mp4", "mov", "avi"].includes(ext)) {
    bg = "bg-purple-500";
    label = "VID";
  } else if (mime.startsWith("audio/") || ["mp3", "wav"].includes(ext)) {
    bg = "bg-amber-500";
    label = "AUD";
  }

  return (
    <div
      className={`w-10 h-12 rounded flex items-center justify-center text-[10px] font-bold text-white ${bg} flex-shrink-0`}
    >
      {label}
    </div>
  );
}

/* =========================
 * Mock รายชื่อนักเรียน (ยังใช้เดิม)
 * ========================= */
type StudentSubmission = {
  id: number;
  studentId: string;
  name: string;
  submission: { submissionDate: string } | null;
};

const studentSubmissions: StudentSubmission[] = [
  {
    id: 1,
    studentId: "00000001",
    name: "ส้มตำ ไก่ย่าง",
    submission: { submissionDate: "2025-07-20T18:30:00" },
  },
  { id: 2, studentId: "00000002", name: "ข้าวเหนียว หมูทอด", submission: null },
  {
    id: 3,
    studentId: "00000003",
    name: "กิ่งฟ้า คล้ายสวน",
    submission: { submissionDate: "2025-07-22T09:00:00" },
  },
];

/* =========================
 * Helper แปลงสถานะการส่ง
 * ========================= */
const getStudentStatus = (student: StudentSubmission, dueDate: Date) => {
  if (!student.submission)
    return { text: "ยังไม่ได้ส่ง", className: "bg-red-100 text-red-800" };
  const submissionDate = new Date(student.submission.submissionDate);
  if (submissionDate > dueDate)
    return { text: "ส่งเลยกำหนด", className: "bg-yellow-100 text-yellow-800" };
  return { text: "ส่งแล้ว", className: "bg-green-100 text-green-800" };
};

/* =========================
 * Helper แปลงวันกำหนดส่งสวย ๆ
 * ========================= */
function formatDue(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/* =========================
 * Helper เลือก URL ไฟล์แนบจาก DTO
 * ========================= */
function getAttachmentUrl(att: any): string | undefined {
  // เดา field ชื่อที่เป็นไปได้
  return att.file_url || att.url || att.file || att.document || undefined;
}

/* =========================
 * หน้า Assignment Details
 * ========================= */
const AssignmentDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // smartBack (ใช้ logic เดิมจากไฟล์เก่า)
  const smartBack = () => {
    const from = searchParams.get("from") || searchParams.get("returnTo");
    if (from) {
      try {
        const url = decodeURIComponent(from);
        if (url.startsWith("/")) {
          router.push(url);
          return;
        }
      } catch {}
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    const ref = document.referrer;
    if (ref) {
      try {
        const refUrl = new URL(ref);
        if (refUrl.origin === window.location.origin) {
          router.push(`${refUrl.pathname}${refUrl.search}${refUrl.hash}`);
          return;
        }
      } catch {}
    }

    const courseId = searchParams.get("courseId");
    if (courseId) {
      router.push(`/edit-lesson?id=${courseId}`);
    } else {
      router.push("/my-courses");
    }
  };

  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  // โหลด assignment จาก BE ด้วย findAssignment
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!courseId) {
        setError("ไม่พบ courseId ใน URL");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const found = await findAssignment(courseId, lessonId || undefined);
        if (!mounted) return;

        if (!found) {
          setError("ไม่พบข้อมูลงานที่มอบหมายสำหรับคอร์สนี้");
          setAssignment(null);
        } else {
          setAssignment(found);
        }
      } catch (e) {
        console.error("load assignment failed:", e);
        if (mounted) {
          setError("โหลดข้อมูลงานที่มอบหมายไม่สำเร็จ");
          setAssignment(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [courseId, lessonId]);

  // ใช้ due_at จาก BE ถ้ามี ถ้าไม่มีก็ใช้เวลาปัจจุบันกันพัง
  const dueDate: Date = useMemo(() => {
    if (assignment?.due_at) {
      return new Date(assignment.due_at);
    }
    return new Date();
  }, [assignment?.due_at]);

  // แตกรายละเอียดเป็นบรรทัด ๆ จาก details
  const descriptionLines = useMemo(() => {
    if (!assignment?.details) return [];
    return assignment.details.split(/\r?\n/).filter((l) => l.trim().length > 0);
  }, [assignment?.details]);

  // เอกสารแนบจาก BE
  const attachments = assignment?.attachments ?? [];

  // Filter รายชื่อนักเรียน (ยัง mock อยู่)
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return studentSubmissions
      .filter((student) => {
        if (filterStatus === "ทั้งหมด") return true;
        const status = getStudentStatus(student, dueDate);
        return status.text === filterStatus;
      })
      .filter((student) => {
        if (!query) return true;
        return (
          student.name.toLowerCase().includes(query) ||
          student.studentId.toLowerCase().includes(query)
        );
      });
  }, [filterStatus, searchQuery, dueDate]);

  const handleRowClick = (studentId: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    router.push(`/submission?id=${studentId}&${currentParams.toString()}`);
  };

  // Options สำหรับ combobox
  const statusOptions: ComboboxOption[] = [
    { value: "ทั้งหมด", label: "ทั้งหมด" },
    { value: "ส่งแล้ว", label: "ส่งแล้ว" },
    { value: "ยังไม่ได้ส่ง", label: "ยังไม่ได้ส่ง" },
    { value: "ส่งเลยกำหนด", label: "ส่งเลยกำหนด" },
  ];

  const studentOptions: ComboboxOption[] = studentSubmissions.map((s) => ({
    value: s.name,
    label: `${s.studentId} - ${s.name}`,
  }));

  /* ========== Loading / Error State ========== */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto mt-8 mb-16 bg-white p-4 sm:p-6 lg:p-10 border border-gray-300 rounded-xl shadow-lg">
        <div className="mb-6">
          <button
            type="button"
            onClick={smartBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            title="ย้อนกลับ"
          >
            <FaArrowLeft size={12} />
            ย้อนกลับ
          </button>
        </div>
        <p className="text-gray-600">กำลังโหลดรายละเอียดงาน...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-7xl mx-auto mt-8 mb-16 bg-white p-4 sm:p-6 lg:p-10 border border-gray-300 rounded-xl shadow-lg">
        <div className="mb-6">
          <button
            type="button"
            onClick={smartBack}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            title="ย้อนกลับ"
          >
            <FaArrowLeft size={12} />
            ย้อนกลับ
          </button>
        </div>
        <p className="text-red-600">
          {error || "ไม่พบข้อมูลงานที่มอบหมาย"}
        </p>
      </div>
    );
  }

  /* ========== Main UI เมื่อมี assignment แล้ว ========== */
  return (
    <div className="max-w-7xl mx-auto mt-8 mb-16 bg-white p-4 sm:p-6 lg:p-10 border border-gray-300 rounded-xl shadow-lg">
      {/* ปุ่มย้อนกลับ */}
      <div className="mb-6">
        <button
          type="button"
          onClick={smartBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          title="ย้อนกลับ"
        >
          <FaArrowLeft size={12} />
          ย้อนกลับ
        </button>
      </div>

      {/* หัวข้อ + กำหนดส่ง */}
      <header className="border-b border-gray-200 pb-6 mb-10">
        <h1 className="text-2xl font-semibold mb-2">
          {assignment.title || "งานที่มอบหมาย"}
        </h1>
        <p className="text-md text-gray-600">
          กำหนดส่ง {formatDue(assignment.due_at)}
        </p>
      </header>

      {/* รายละเอียดงาน */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">รายละเอียด</h2>
        <div className="text-gray-700 text-base leading-relaxed space-y-2">
          {descriptionLines.length > 0 ? (
            descriptionLines.map((line, index) => <p key={index}>{line}</p>)
          ) : (
            <p className="text-gray-500">ไม่มีรายละเอียดเพิ่มเติม</p>
          )}
        </div>
      </section>

      {/* เอกสารอ้างอิง (จาก attachments ใน BE) */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">เอกสารอ้างอิง (optional)</h2>

        {attachments.length === 0 ? (
          <p className="text-gray-500 text-sm">
            ยังไม่มีเอกสารอ้างอิงที่แนบไว้
          </p>
        ) : (
          <div className="space-y-3 max-w-lg">
            {attachments.map((att) => {
              const fileName = att.original_name || att.title || "ไฟล์แนบ";
              const fileType =
                att.content_type || "ไฟล์แนบจากผู้สอน";
              const url = getAttachmentUrl(att);

              const cardInner = (
                <div className="border border-slate-200 bg-slate-50 rounded-lg p-3 max-w-md flex items-center justify-between hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <FileBadge
                      mime={att.content_type || undefined}
                      name={fileName}
                    />
                    <div className="truncate">
                      <p
                        className="font-semibold text-gray-800 text-sm truncate max-w-[250px]"
                        title={fileName}
                      >
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {fileType}
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-700 p-2 flex-shrink-0"
                    type="button"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
              );

              return url ? (
                <a
                  key={att.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cardInner}
                </a>
              ) : (
                <div key={att.id}>{cardInner}</div>
              );
            })}
          </div>
        )}
      </section>

      {/* รายชื่อนักเรียน (ยังเป็น mock / UI เดิม) */}
      <section>
        <h2 className="text-[21px] font-semibold shrink-0 mb-4">
          รายชื่อนักเรียน
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-80">
            <Combobox
              options={studentOptions}
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="ค้นหาจากชื่อ หรือ รหัสนักเรียน..."
              isSearchable={true}
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="status-filter"
              className="text-base font-semibold shrink-0"
            >
              สถานะ :
            </label>
            <div className="w-full sm:w-40">
              <Combobox
                options={statusOptions}
                value={filterStatus}
                onChange={setFilterStatus}
              />
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block border mb-8 border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-center">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-[16px] font-semibold border-r w-16">
                  #
                </th>
                <th className="p-3 text-[16px] font-semibold border-r w-1/3">
                  รหัสนักเรียน
                </th>
                <th className="p-3 text-[16px] font-semibold border-r">
                  ชื่อ - สกุล
                </th>
                <th className="p-3 text-[16px] font-semibold w-1/4">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const status = getStudentStatus(student, dueDate);
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleRowClick(student.id)}
                    >
                      <td className="p-3 text-[14px] border-r">
                        {student.id}
                      </td>
                      <td className="p-3 text-[14px] border-r">
                        {student.studentId}
                      </td>
                      <td className="p-3 text-[14px] border-r">
                        {student.name}
                      </td>
                      <td className="p-3 text-[14px]">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-600 p-6">
                    ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const status = getStudentStatus(student, dueDate);
              return (
                <div
                  key={student.id}
                  onClick={() => handleRowClick(student.id)}
                  className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold break-all pr-2">
                      {student.name}
                    </p>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full shrink-0 ${status.className}`}
                    >
                      {status.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-600">
                      รหัสนักเรียน :
                    </span>{" "}
                    {student.studentId}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-600 p-6 bg-gray-50 rounded-lg">
              ไม่พบข้อมูลนักเรียนที่ตรงกับเงื่อนไข
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AssignmentDetailsPage;
