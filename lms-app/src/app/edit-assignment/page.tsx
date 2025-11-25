"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PenSquare, Upload, User, Clock } from "lucide-react";
import {
  FaExclamationTriangle,
  FaTimes,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import {
  findAssignment,
  createAssignment,
  updateAssignment,
  addAttachments,
  removeAttachment,
  deleteAssignment,
  type AssignmentDTO,
} from "@/lib/assignmentApi";
import toast, { Toaster } from "react-hot-toast";
import { toISO } from "@/lib/assignmentApi";

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border border-gray-300">
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

type FieldErrors = {
  title?: string;
  details?: string;
  assignTo?: string;
  date?: string;
  time?: string;
};

// ---- Helper แสดง icon ตามชนิดไฟล์ ----
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

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const effectRan = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [isNewAssignment, setIsNewAssignment] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<
    AssignmentDTO["attachments"]
  >([]);

  // error ฟิลด์ข้อความ/เลข
  const [errors, setErrors] = useState<FieldErrors>({});
  // error เฉพาะโซนไฟล์
  const [fileError, setFileError] = useState<string | null>(null);

  const smartBack = () => {
    if (isEditing && hasBeenEdited) {
      const ok = window.confirm(
        "มีการแก้ไขที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?"
      );
      if (!ok) return;
    }

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

    if (courseId) {
      router.push(`/edit-lesson?id=${courseId}`);
    } else {
      router.push("/my-courses");
    }
  };

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const cId = searchParams.get("courseId");
    const lId = searchParams.get("lessonId");
    if (cId) setCourseId(cId);
    if (lId) setLessonId(lId);

    (async () => {
      if (!cId) return;
      try {
        const found = await findAssignment(cId, lId || undefined);
        if (found) {
          setTitle(found.title || "");
          setDetails(found.details || "");
          setAssignTo(found.assign_to_code || "");
          setExistingAttachments(found.attachments ?? []);
          if (found.due_at) {
            const d = new Date(found.due_at);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mi = String(d.getMinutes()).padStart(2, "0");
            setDateValue(`${yyyy}-${mm}-${dd}`);
            setTimeValue(`${hh}:${mi}`);
          }
          (window as any).__currentAssignmentId = found.id;
          setIsEditing(false);
          setIsNewAssignment(false);
        } else {
          toast("กรุณากรอกข้อมูลสำหรับ Assignment ใหม่", { icon: "✍️" });
          setIsEditing(true);
          setIsNewAssignment(true);
        }
      } catch (err) {
        console.error(err);
        toast.error("โหลดข้อมูลไม่สำเร็จ");
      }
    })();
  }, [searchParams]);

  const handleNavigateToDetails = () => {
    if (!isNewAssignment && courseId && lessonId) {
      router.push(
        `/assignment-details?courseId=${courseId}&lessonId=${lessonId}`
      );
    }
  };

  // ตรวจสอบฟอร์ม text/date/time
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!title.trim()) {
      newErrors.title = "กรุณากรอกหัวข้องาน";
    }

    if (!details.trim()) {
      newErrors.details = "กรุณากรอกรายละเอียดงาน";
    }

    if (!assignTo.trim()) {
      newErrors.assignTo = "กรุณากรอกรหัสคอร์ส";
    } else if (assignTo.length !== 6) {
      newErrors.assignTo = "กรุณากรอกรหัสคอร์สให้ครบ 6 หลัก";
    }

    if (!dateValue) {
      newErrors.date = "กรุณาเลือกวันที่กำหนดส่งงาน";
    }

    if (!timeValue) {
      newErrors.time = "กรุณาเลือกเวลาที่กำหนดส่งงาน";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSaveToggle = async () => {
    if (isEditing) {
      // validate ช่องข้อความก่อน
      if (!validateForm()) {
        return;
      }

      // ✅ เช็กว่า "มีไฟล์อย่างน้อย 1 ไฟล์" ไหม (ทั้งไฟล์เดิม + ใหม่)
      if (
        (existingAttachments?.length ?? 0) === 0 &&
        selectedFiles.length === 0
      ) {
        setFileError("กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์");
        toast.error("กรุณาอัปโหลดไฟล์อย่างน้อย 1 ไฟล์");
        return;
      } else {
        setFileError(null);
      }

      const dueAtISO = toISO(dateValue, timeValue);
      try {
        if (isNewAssignment) {
          const created = await createAssignment({
            courseId: courseId!,
            lessonId: lessonId || undefined,
            title,
            details,
            assignToCode: assignTo,
            dueAtISO,
            files: selectedFiles,
          });
          (window as any).__currentAssignmentId = created.id;
          toast.success("สร้าง Assignment สำเร็จ");

          setIsNewAssignment(false);
          const refreshed = await findAssignment(
            courseId!,
            lessonId || undefined
          );
          setExistingAttachments(refreshed?.attachments ?? []);
        } else {
          const id = (window as any).__currentAssignmentId as string;

          await updateAssignment(id, {
            title,
            details,
            assignToCode: assignTo,
            dueAtISO,
          });

          if (selectedFiles.length > 0) {
            await addAttachments(id, selectedFiles);
          }

          toast.success("บันทึกการแก้ไขสำเร็จ");

          const refreshed = await findAssignment(
            courseId!,
            lessonId || undefined
          );
          setExistingAttachments(refreshed?.attachments ?? []);
        }

        setIsEditing(false);
        setSelectedFiles([]);
        setHasBeenEdited(false);
      } catch (e) {
        console.error(e);
        toast.error("บันทึกไม่สำเร็จ");
      }
    } else {
      // เข้าโหมดแก้ไข → ล้าง error เดิม
      setErrors({});
      setFileError(null);
      setIsEditing(true);
      toast("คุณอยู่ในโหมดแก้ไข", { icon: "✍️" });
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleEditSaveToggle();
  };

  const handleDelete = () => {
    setIsModalOpen(true);
  };

  const confirmDeletion = async () => {
    setIsModalOpen(false);
    const toastId = toast.loading("กำลังลบงาน...");
    try {
      const id = (window as any).__currentAssignmentId as string;
      await deleteAssignment(id);
      toast.success("ลบงานสำเร็จ", { id: toastId });
      if (courseId) router.push(`/edit-lesson?id=${courseId}`);
    } catch (e) {
      console.error(e);
      toast.error("ลบไม่สำเร็จ", { id: toastId });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
      setFileError(null); // ✅ มีไฟล์แล้ว ล้าง error
      if (isEditing) setHasBeenEdited(true);
    }
    event.target.value = "";
  };

  const handleUploadClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
    if (isEditing) setHasBeenEdited(true);
  };

  const handleRemoveExistingAttachment = async (attachmentId: string) => {
    if (!isEditing) return;
    const assnId = (window as any).__currentAssignmentId as string | undefined;
    if (!assnId) return;

    try {
      await removeAttachment(assnId, attachmentId);
      setExistingAttachments((prev) =>
        (prev ?? []).filter((att) => att.id !== attachmentId)
      );
      toast.success("ลบไฟล์แนบแล้ว");
    } catch (e) {
      console.error(e);
      toast.error("ลบไฟล์แนบไม่สำเร็จ");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    setDueDate(`${newDate}T${timeValue || "00:00"}`);
    if (isEditing) setHasBeenEdited(true);
    setErrors((prev) => ({ ...prev, date: undefined }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    setDueDate(`${dateValue}T${newTime}`);
    if (isEditing) setHasBeenEdited(true);
    setErrors((prev) => ({ ...prev, time: undefined }));
  };

  const handleAssignToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, "");
    if (numericValue.length <= 6) {
      setAssignTo(numericValue);
      if (isEditing) setHasBeenEdited(true);
      setErrors((prev) => ({ ...prev, assignTo: undefined }));
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleFormSubmit}
      className="max-w-6xl mx-auto mt-8 mb-16 bg-white p-4 sm:p-6 lg:p-10 border border-gray-200 rounded-2xl shadow-lg"
    >
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeletion}
        title="ยืนยันการลบ"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบงานที่มอบหมายนี้?"
      />

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
          error: { style: { background: "#FFF1F2", color: "black" } },
          success: { style: { background: "#F0FDF4", color: "black" } },
          loading: { style: { background: "#EFF6FF", color: "black" } },
        }}
      />

      <header className="mb-10">
        <h1 className="text-[24px] font-semibold text-gray-800 mb-4">
          Assignment
        </h1>
        <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
          <button
            type="button"
            onClick={smartBack}
            className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold cursor-pointer hover:bg-gray-100"
            title="ย้อนกลับ"
          >
            <FaArrowLeft className="inline-block mr-2" />
            ย้อนกลับ
          </button>
          <button
            type="button"
            onClick={handleNavigateToDetails}
            disabled={isNewAssignment || isEditing}
            className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold cursor-pointer hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            รายละเอียดงาน
          </button>
          <button
            type="submit"
            className={`w-full sm:w-auto py-3 px-8 rounded-full border-none text-base cursor-pointer font-semibold transition-colors ${
              isEditing
                ? "bg-[#31E3CB] text-black hover:bg-teal-400"
                : "bg-[#2F88FC] text-black hover:bg-blue-600"
            }`}
          >
            {isEditing ? "บันทึก Assignment" : "แก้ไข Assignment"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isNewAssignment}
            className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold cursor-pointer hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            <FaTrash className="inline-block mr-1" /> ลบ Assignment
          </button>
        </div>
      </header>

      <main className="space-y-8">
        {/* หัวข้องาน */}
        <div>
          <label className="flex items-center gap-3 mb-2">
            <PenSquare className="text-gray-500" size={20} />
            <span className="font-semibold text-[20px]">หัวข้องาน</span>
          </label>
          <input
            type="text"
            placeholder="ตั้งชื่องาน"
            className={`w-full text-[16px] p-3 rounded-xl focus:outline-none focus:ring-1 ${
              errors.title
                ? "border border-red-500 focus:ring-red-400"
                : "border border-gray-300 focus:ring-gray-300"
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (isEditing) setHasBeenEdited(true);
              setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            disabled={!isEditing}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        {/* รายละเอียดงาน */}
        <div>
          <label className="block mb-2 font-semibold text-[20px] ">
            รายละเอียดงาน
          </label>
          <textarea
            placeholder="รายละเอียดงาน"
            rows={7}
            className={`w-full p-3 text-[16px] rounded-xl focus:outline-none focus:ring-1 ${
              errors.details
                ? "border border-red-500 focus:ring-red-400"
                : "border border-gray-300 focus:ring-gray-300"
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            value={details}
            onChange={(e) => {
              setDetails(e.target.value);
              if (isEditing) setHasBeenEdited(true);
              setErrors((prev) => ({ ...prev, details: undefined }));
            }}
            disabled={!isEditing}
          ></textarea>
          {errors.details && (
            <p className="mt-1 text-sm text-red-500">{errors.details}</p>
          )}
        </div>

        {/* Upload file */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            disabled={!isEditing}
          />

          {/* แถวปุ่ม Upload + ข้อความช่วยอธิบาย */}
          <div className="flex flex-col gap-1">
            <div
              onClick={handleUploadClick}
              className={`flex items-center gap-3 w-fit ${
                isEditing
                  ? "cursor-pointer hover:text-gray-500"
                  : "cursor-not-allowed text-gray-400"
              } transition-colors`}
            >
              <Upload size={20} />
              <span className="font-semibold text-[20px]">Upload file</span>
            </div>

            {/* ข้อความช่วยอธิบาย (ไม่มี 20MB แล้ว) */}
            <p className="text-sm text-gray-500">
              รองรับไฟล์เอกสาร / รูปภาพ และเลือกได้หลายไฟล์
            </p>

            {/* error ขอโซนไฟล์ */}
            {fileError && (
              <p className="text-sm text-red-500 mt-1">{fileError}</p>
            )}
          </div>

          <div
            className={`mt-6 space-y-3 ${
              fileError ? "border border-red-400 rounded-lg p-3" : ""
            }`}
          >
            {(existingAttachments ?? []).map((att) => (
              <div
                key={att.id}
                className="border border-slate-200 bg-slate-50 rounded-lg p-3 max-w-md flex items-center justify-between"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <FileBadge
                    mime={att.content_type || undefined}
                    name={att.original_name || att.title}
                  />
                  <div className="truncate">
                    <p
                      className="font-semibold text-gray-800 text-sm truncate"
                      title={att.original_name || att.title}
                    >
                      {att.original_name || att.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {att.content_type || "ไฟล์ที่แนบแล้ว"}
                    </p>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingAttachment(att.id)}
                    className="text-gray-500 hover:text-red-500 p-2 flex-shrink-0"
                    aria-label={`Remove ${att.original_name || att.title}`}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}

            {selectedFiles.map((file, index) => (
              <div
                key={`new-${index}`}
                className="border border-slate-200 bg-slate-50 rounded-lg p-3 max-w-md flex items-center justify-between"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <FileBadge mime={file.type} name={file.name} />
                  <div className="truncate">
                    <p
                      className="font-semibold text-gray-800 text-sm truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.type || "ไฟล์ใหม่ ยังไม่บันทึก"}
                    </p>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-500 hover:text-red-500 p-2 flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* มอบหมายให้ */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] mt-10 items-center gap-x-12 gap-y-2">
          <label className="flex items-center gap-3">
            <User className="text-gray-500" size={20} />
            <span className="font-semibold text-[20px]">มอบหมายให้</span>
          </label>
          <div>
            <input
              type="text"
              placeholder="กรอกรหัสคอร์ส 6 หลัก"
              className={`w-full text-[16px] p-3 rounded-xl focus:outline-none focus:ring-1 ${
                errors.assignTo
                  ? "border border-red-500 focus:ring-red-400"
                  : "border border-gray-300 focus:ring-gray-300"
              } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              value={assignTo}
              onChange={handleAssignToChange}
              disabled={!isEditing}
              maxLength={6}
            />
            {errors.assignTo && (
              <p className="mt-1 text-sm text-red-500">{errors.assignTo}</p>
            )}
          </div>
        </div>

        {/* กำหนดส่งงาน */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-start gap-x-9 gap-y-2">
          <label className="flex items-center gap-3 text-gray-700 mt-3">
            <Clock className="text-gray-500" size={20} />
            <span className="font-semibold text-[20px]">กำหนดส่งงาน</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                วันที่
              </label>
              <input
                type="date"
                className={`w-full text-[16px] p-3 rounded-xl focus:outline-none focus:ring-1 ${
                  errors.date
                    ? "border border-red-500 focus:ring-red-400"
                    : "border border-gray-300 focus:ring-gray-300"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                value={dateValue}
                onChange={handleDateChange}
                disabled={!isEditing}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                ชั่วโมง : นาที
              </label>
              <input
                type="time"
                className={`w-full text-[16px] p-3 rounded-xl focus:outline-none focus:ring-1 ${
                  errors.time
                    ? "border border-red-500 focus:ring-red-400"
                    : "border border-gray-300 focus:ring-gray-300"
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                value={timeValue}
                onChange={handleTimeChange}
                disabled={!isEditing}
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-500">{errors.time}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </form>
  );
};

export default Page;
