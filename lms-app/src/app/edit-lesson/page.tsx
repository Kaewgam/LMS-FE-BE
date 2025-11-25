"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import {
  FaPlus,
  FaPencilAlt,
  FaTimes,
  FaFileVideo,
  FaFileAlt,
  FaUpload,
  FaTrash,
  FaArrowLeft,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast, { Toaster } from "react-hot-toast";
import api from "@/lib/api";

/* =========================
 * Types
 * ========================= */
interface Lesson {
  id: number;
  title: string;
  description: string;

  videoFile: File | null;
  documentFile: File | null;

  imagePreview: string | null; // ใช้แสดง
  imageFile: File | null; // ใช้ส่งอัปเดตไป BE

  hasAssignment: boolean;
  videos?: MaterialDTO[];
  documents?: MaterialDTO[];

  pendingDeleteVideoId?: string | null;
  pendingDeleteDocumentId?: string | null;
}

type ChapterDTO = {
  id: string;
  course: string;
  title: string;
  description: string;
  order?: number;
  position?: number | null;
  cover_image_url?: string | null;
};

type MaterialDTO = {
  id: string;
  chapter: string;
  type: "video" | "document";
  file_url: string;
  filename?: string | null;
  title?: string | null;
};

/* =========================
 * Helpers
 * ========================= */
const safeText = (v?: string | null) => {
  if (!v) return "";
  const t = String(v).trim();
  if (t.toLowerCase() === "undefined" || t.toLowerCase() === "null") return "";
  return t;
};

const getBasenameFromUrl = (url?: string | null) => {
  try {
    if (!url) return "";
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost";
    const u = new URL(url, base);
    const last = (u.pathname.split("/").pop() || "").split("?")[0];
    return decodeURIComponent(last || "");
  } catch {
    if (!url) return "";
    const raw = (url.split("/").pop() || "").split("?")[0];
    return decodeURIComponent(raw || "");
  }
};

/* =========================
 * API helpers
 * ========================= */
const CHAPTERS_PATH = "/api/chapters/";
const MATERIALS_PATH = "/api/materials/";
const MATERIALS_UPLOAD_PATH = "/api/materials/upload/";

const beIdByIndex: Record<number, string> = {};

function mapChapterToLesson(ch: ChapterDTO, idx: number): Lesson {
  beIdByIndex[idx] = ch.id;
  return {
    id: idx + 1,
    title: ch.title ?? "",
    description: ch.description ?? "",
    videoFile: null,
    documentFile: null,
    imagePreview: ch.cover_image_url ?? null,
    imageFile: null,
    hasAssignment: false,
    videos: [],
    documents: [],
    pendingDeleteVideoId: null,
    pendingDeleteDocumentId: null,
  };
}

async function listChaptersByCourse(courseId: string): Promise<ChapterDTO[]> {
  const { data } = await api.get(CHAPTERS_PATH, {
    params: { course: courseId, ordering: "order" },
  });
  return Array.isArray(data) ? data : (data as any)?.results ?? [];
}

/** สร้าง chapter (รองรับ cover_image) */
async function createChapter(payload: {
  course: string;
  title: string;
  description?: string;
  order?: number;
  cover_image?: File | null;
}) {
  const fd = new FormData();
  fd.set("course", payload.course);
  fd.set("title", payload.title);
  fd.set("description", payload.description ?? "");
  if (payload.order != null) fd.set("order", String(payload.order));
  if (payload.cover_image) fd.set("cover_image", payload.cover_image);
  const { data } = await api.post(CHAPTERS_PATH, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as ChapterDTO;
}

/** อัปเดต chapter (ถ้ามีไฟล์ ให้ส่งแบบ multipart) */
async function updateChapter(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    order: number;
    cover_image: File | null;
  }>
) {
  // ถ้ามีส่ง field cover_image แปลว่าใช้ multipart
  if (Object.prototype.hasOwnProperty.call(payload, "cover_image")) {
    const fd = new FormData();
    if (payload.title != null) fd.set("title", payload.title);
    if (payload.description != null) fd.set("description", payload.description);
    if (payload.order != null) fd.set("order", String(payload.order));
    if (payload.cover_image) fd.set("cover_image", payload.cover_image);
    const { data } = await api.patch(`${CHAPTERS_PATH}${id}/`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as ChapterDTO;
  }
  const { data } = await api.patch(`${CHAPTERS_PATH}${id}/`, payload);
  return data as ChapterDTO;
}

async function deleteChapter(id: string) {
  await api.delete(`${CHAPTERS_PATH}${id}/`);
}

async function listMaterialsByChapter(
  chapterId: string
): Promise<MaterialDTO[]> {
  const { data } = await api.get(MATERIALS_PATH, {
    params: { chapter: chapterId },
  });
  return Array.isArray(data) ? data : (data as any)?.results ?? [];
}

async function deleteMaterialAPI(id: string) {
  await api.delete(`${MATERIALS_PATH}${id}/`);
}

async function uploadMaterial(
  chapterId: string,
  kind: "video" | "document",
  file: File,
  title?: string
) {
  const fd = new FormData();
  fd.set("chapter", chapterId);
  fd.set("type", kind.toLowerCase());
  fd.set("file", file);
  if (title) fd.set("title", title);
  const { data } = await api.post(MATERIALS_UPLOAD_PATH, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data as MaterialDTO;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "ยืนยันการลบ",
  message = "คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}) => {
  if (!isOpen) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={stop}
        className="bg-white w-full max-w-md mx-4 rounded-xl shadow-xl border"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
            aria-label="close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-6 py-5 text-gray-700">{message}</div>

        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-semibold text-white bg-rose-600 hover:bg-rose-700"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================
 * Upload Box
 * ========================= */
type FileUploadBoxProps = {
  id: string;
  title: string;
  accept: string;
  disabled: boolean;

  file: File | null;
  onFileChange: (f: File | null) => void;

  existing: MaterialDTO | null;

  pendingDelete: boolean;
  onMarkRemoveExisting: () => void;
  onUndoRemoveExisting: () => void;
};

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  id,
  title,
  accept,
  disabled,
  file,
  onFileChange,
  existing,
  pendingDelete,
  onMarkRemoveExisting,
  onUndoRemoveExisting,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const pickIcon = () =>
    accept.startsWith("video") ? (
      <FaFileVideo className="text-4xl" />
    ) : (
      <FaFileAlt className="text-4xl" />
    );

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const existingDisplayName =
    safeText(existing?.filename) ||
    getBasenameFromUrl(existing?.file_url) ||
    safeText(existing?.title) ||
    "ไฟล์ที่อัปโหลดแล้ว";

  // ✅ กันการกดลบ/ยกเลิกลบขณะ disabled
  const safeMarkRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onMarkRemoveExisting();
  };
  const safeUndoRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onUndoRemoveExisting();
  };

  return (
    <div className="col-span-1 lg:col-span-2">
      <label className="text-xl font-semibold mb-4 block">{title}</label>
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center min-h-[140px] text-center transition-colors ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white hover:bg-gray-50 cursor-pointer"
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          onClick={(e) => ((e.target as HTMLInputElement).value = "")}
        />

        {/* 1) แสดงไฟล์ใหม่ที่เพิ่งเลือก */}
        {file && (
          <div
            className="flex flex-col items-center gap-2 text-gray-800"
            onClick={stop}
          >
            {pickIcon()}
            <p className="font-semibold break-all">{file.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>

            {/* ✅ ซ่อนปุ่มลบไฟล์ใหม่เมื่อยังไม่อยู่โหมดแก้ไข */}
            {!disabled && (
              <button
                type="button"
                onClick={(ev) => {
                  ev.stopPropagation();
                  onFileChange(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mt-2 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
              >
                <FaTimes /> ลบไฟล์
              </button>
            )}
          </div>
        )}

        {/* 2) ยังไม่ได้เลือกใหม่ => แสดงไฟล์เดิมจากเซิร์ฟเวอร์ */}
        {!file && existing && (
          <div
            className="flex flex-col items-center gap-2 text-gray-800"
            onClick={stop}
          >
            {pickIcon()}
            <a
              href={existing.file_url}
              target="_blank"
              rel="noreferrer"
              className={`font-semibold break-all underline ${
                pendingDelete ? "pointer-events-none opacity-60" : ""
              }`}
              title="เปิดไฟล์"
              onClick={(e) => e.stopPropagation()}
            >
              {existingDisplayName}
            </a>

            {/* ✅ ทั้ง “ลบไฟล์” และ “ยกเลิกการลบ” จะแสดงเฉพาะตอนแก้ไข */}
            {!disabled && (
              <>
                {pendingDelete ? (
                  <>
                    <span className="text-xs text-rose-600">
                      ไฟล์นี้จะถูกลบเมื่อกดบันทึก
                    </span>
                    <button
                      type="button"
                      onClick={safeUndoRemove}
                      className="mt-1 text-gray-600 hover:text-gray-800 text-xs font-bold"
                    >
                      ยกเลิกการลบ
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={safeMarkRemove}
                    className="mt-2 text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                  >
                    <FaTimes /> ลบไฟล์
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* 3) ไม่มีทั้งไฟล์ใหม่และไฟล์เดิม */}
        {!file && !existing && (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <FaUpload className="text-3xl" />
            <span className="font-semibold">คลิกเพื่อเลือกไฟล์</span>
            <span className="text-xs">คุณสามารถเลือกไฟล์จากเครื่องของคุณ</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
 * Sortable Tab
 * ========================= */
const SortableLessonTitleTab = ({
  id,
  title,
  active,
  onClick,
  disabled,
}: {
  id: number;
  title: string;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full text-center py-2 px-4 rounded-lg text-sm font-semibold truncate transition-colors ${
        disabled ? "cursor-not-allowed" : "cursor-grab"
      } ${
        active
          ? "bg-gray-500 text-white shadow-md"
          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
      }`}
      onClick={onClick}
      title={title}
    >
      {title || "บทเรียนใหม่"}
    </button>
  );
};

/* =========================
 * Main Component
 * ========================= */
const CourseLessonForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [isLessonEditing, setIsLessonEditing] = useState(false);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ error states เฉพาะ 2 ช่อง
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  const clearFieldError = (k: keyof typeof fieldErrors) =>
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const { [k]: _discard, ...rest } = prev;
      return rest;
    });

  const validateTitleDesc = (title: string, description: string) => {
    const e: typeof fieldErrors = {};
    if (!title.trim()) e.title = "กรุณากรอกชื่อบทเรียน";
    if (!description.trim()) e.description = "กรุณากรอกคำอธิบายบทเรียน";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isLessonEditing && isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isLessonEditing, isDirty]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    setCourseId(id);

    (async () => {
      try {
        const rows = await listChaptersByCourse(id);
        Object.keys(beIdByIndex).forEach((k) => delete beIdByIndex[+k]);

        if (rows.length === 0) {
          const first: Lesson = {
            id: Date.now(),
            title: "",
            description: "",
            videoFile: null,
            documentFile: null,
            imagePreview: null,
            imageFile: null,
            hasAssignment: false,
            videos: [],
            documents: [],
            pendingDeleteVideoId: null,
            pendingDeleteDocumentId: null,
          };
          setLessons([first]);
          setIsLessonEditing(true);
          setActiveLessonIndex(0);
        } else {
          const mapped = rows.map((ch, i) => mapChapterToLesson(ch, i));
          await Promise.all(
            mapped.map(async (l, idx) => {
              const chId = beIdByIndex[idx];
              try {
                const mats = await listMaterialsByChapter(chId);
                l.videos = mats
                  .filter((m) => m.type === "video")
                  .map((m) => ({
                    ...m,
                    filename:
                      safeText(m.filename) ||
                      getBasenameFromUrl(m.file_url) ||
                      safeText(m.title) ||
                      "",
                  }));
                l.documents = mats
                  .filter((m) => m.type === "document")
                  .map((m) => ({
                    ...m,
                    filename:
                      safeText(m.filename) ||
                      getBasenameFromUrl(m.file_url) ||
                      safeText(m.title) ||
                      "",
                  }));
              } catch {
                l.videos = [];
                l.documents = [];
              }
            })
          );
          setLessons(mapped);
          setIsLessonEditing(false);
          setActiveLessonIndex(0);
        }
      } catch (e) {
        console.error(e);
        toast.error("โหลดบทเรียนไม่สำเร็จ");
      }
    })();
  }, [searchParams]);

  // ปุ่มย้อนกลับ: ใช้ ?from ก่อน, แล้วค่อย back(), สุดท้าย fallback
  const smartBack = () => {
    if (isLessonEditing && isDirty) {
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
          return router.push(url);
        }
      } catch {
        /* ignore */
      }
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      return router.back();
    }

    const ref = document.referrer;
    if (ref) {
      const refUrl = new URL(ref);
      if (refUrl.origin === window.location.origin) {
        return router.push(`${refUrl.pathname}${refUrl.search}${refUrl.hash}`);
      }
    }

    const fallback = courseId ? `/course/${courseId}` : "/my-courses";
    router.push(fallback);
  };

  const markDirty = () => setIsDirty(true);

  const handleLessonChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newLessons = [...lessons];
    newLessons[index] = { ...newLessons[index], [name]: value } as Lesson;
    setLessons(newLessons);
    markDirty();

    // ✅ เคลียร์ error ของช่องที่กำลังแก้
    if (name === "title") clearFieldError("title");
    if (name === "description") clearFieldError("description");
  };

  const handleImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] || null;
    const newLessons = [...lessons];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      newLessons[index] = {
        ...newLessons[index],
        imagePreview: imageUrl,
        imageFile: file,
      };
    } else {
      newLessons[index] = {
        ...newLessons[index],
        imagePreview: null,
        imageFile: null,
      };
    }
    setLessons(newLessons);
    markDirty();
  };

  const handleFileChange = (
    index: number,
    fileType: "videoFile" | "documentFile",
    file: File | null
  ) => {
    const newLessons = [...lessons];
    newLessons[index] = { ...newLessons[index], [fileType]: file };
    setLessons(newLessons);
    markDirty();
  };

  const markRemoveExisting = (kind: "video" | "document") => {
    const idx = activeLessonIndex;
    const newLessons = [...lessons];
    if (kind === "video") {
      const target = newLessons[idx].videos?.[0];
      newLessons[idx].pendingDeleteVideoId = target?.id ?? null;
    } else {
      const target = newLessons[idx].documents?.[0];
      newLessons[idx].pendingDeleteDocumentId = target?.id ?? null;
    }
    setLessons(newLessons);
    markDirty();
  };

  const undoRemoveExisting = (kind: "video" | "document") => {
    const idx = activeLessonIndex;
    const newLessons = [...lessons];
    if (kind === "video") newLessons[idx].pendingDeleteVideoId = null;
    else newLessons[idx].pendingDeleteDocumentId = null;
    setLessons(newLessons);
    markDirty();
  };

  const addLesson = () => {
    const newLesson: Lesson = {
      id: Date.now(),
      title: "",
      description: "",
      videoFile: null,
      documentFile: null,
      imagePreview: null,
      imageFile: null,
      hasAssignment: false,
      videos: [],
      documents: [],
      pendingDeleteVideoId: null,
      pendingDeleteDocumentId: null,
    };
    setLessons([...lessons, newLesson]);
    setActiveLessonIndex(lessons.length);
    setIsLessonEditing(true);
    setIsDirty(true);
    toast("คุณอยู่ในโหมดแก้ไขบทเรียนใหม่", { icon: "✍️" });
  };

  /** ลบบทเรียน — อนุญาตให้ลบได้ทุกโหมด */
  const handleDeleteLessonClick = () => {
    if (lessons.length === 1) {
      toast.error("คุณไม่สามารถลบบทเรียนสุดท้ายได้");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteLesson = async () => {
    setIsDeleteModalOpen(false);
    const idx = activeLessonIndex;

    const beId = beIdByIndex[idx];
    if (beId) {
      try {
        await deleteChapter(beId);
      } catch (e) {
        console.error(e);
        toast.error("ลบบทเรียนบนเซิร์ฟเวอร์ไม่สำเร็จ");
        return;
      }
    }

    const newLessons = lessons.filter((_, i) => i !== idx);
    setLessons(newLessons);
    setActiveLessonIndex(Math.max(0, newLessons.length - 1));
    toast.success("ลบบทเรียนสำเร็จ");
    setIsDirty(false);
  };

  const handleEditSaveLessonToggle = async () => {
    if (!courseId) {
      toast.error("ไม่พบ courseId");
      return;
    }

    if (isLessonEditing) {
      const currentLesson = lessons[activeLessonIndex];

      // ✅ ใช้ custom validate เฉพาะ 2 ช่องนี้ (ไม่มี popup)
      const ok = validateTitleDesc(
        currentLesson.title ?? "",
        currentLesson.description ?? ""
      );
      if (!ok) {
        setTimeout(() => {
          const el =
            document.querySelector("[data-field-error='title']") ||
            document.querySelector("[data-field-error='description']");
          (el as HTMLElement | null)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 0);
        return;
      }

      if (!currentLesson.imagePreview) {
        toast.error("กรุณาอัปโหลดรูปหน้าปกบทเรียน");
        return;
      }

      const hasVideoServer =
        (currentLesson.videos?.length ?? 0) > 0 &&
        !currentLesson.pendingDeleteVideoId;
      const hasDocServer =
        (currentLesson.documents?.length ?? 0) > 0 &&
        !currentLesson.pendingDeleteDocumentId;

      if (!hasVideoServer && !currentLesson.videoFile) {
        toast.error("กรุณาอัปโหลดไฟล์วิดีโอสำหรับบทเรียน");
        return;
      }
      if (!hasDocServer && !currentLesson.documentFile) {
        toast.error("กรุณาอัปโหลดเอกสารประกอบสำหรับบทเรียน");
        return;
      }

      let chapterId: string | undefined;
      try {
        const existingId = beIdByIndex[activeLessonIndex];
        if (existingId) {
          const updated = await updateChapter(existingId, {
            title: currentLesson.title,
            description: currentLesson.description,
            order: activeLessonIndex + 1,
            ...(currentLesson.imageFile
              ? { cover_image: currentLesson.imageFile }
              : {}),
          });
          chapterId = existingId;
          if (updated.cover_image_url) {
            const nl = [...lessons];
            nl[activeLessonIndex].imagePreview = updated.cover_image_url;
            nl[activeLessonIndex].imageFile = null;
            setLessons(nl);
          }
        } else {
          const created = await createChapter({
            course: courseId,
            title: currentLesson.title,
            description: currentLesson.description,
            order: activeLessonIndex + 1,
            cover_image: currentLesson.imageFile ?? null,
          });
          chapterId = created.id;
          beIdByIndex[activeLessonIndex] = created.id;

          const nl = [...lessons];
          nl[activeLessonIndex].imagePreview =
            created.cover_image_url ?? nl[activeLessonIndex].imagePreview;
          nl[activeLessonIndex].imageFile = null;
          setLessons(nl);
        }
      } catch (e: any) {
        console.error(e);
        toast.error(
          e?.response?.data?.detail ||
            e?.response?.data?.message ||
            "บันทึกบทเรียนไม่สำเร็จ"
        );
        return;
      }

      // 1) ลบไฟล์ที่ mark pending
      if (chapterId) {
        const toDelete: string[] = [];
        if (currentLesson.pendingDeleteVideoId)
          toDelete.push(currentLesson.pendingDeleteVideoId);
        if (currentLesson.pendingDeleteDocumentId)
          toDelete.push(currentLesson.pendingDeleteDocumentId);

        if (toDelete.length) {
          try {
            await Promise.all(toDelete.map((id) => deleteMaterialAPI(id)));
          } catch {
            toast.error("ลบไฟล์เดิมไม่สำเร็จ");
          }
        }
      }

      // 2) อัปโหลดไฟล์ใหม่
      if (chapterId) {
        const newLessons = [...lessons];

        if (currentLesson.videoFile) {
          try {
            const up = await uploadMaterial(
              chapterId,
              "video",
              currentLesson.videoFile,
              currentLesson.videoFile.name
            );
            newLessons[activeLessonIndex].videos = [up];
            newLessons[activeLessonIndex].videoFile = null;
            newLessons[activeLessonIndex].pendingDeleteVideoId = null;
          } catch {
            toast.error("อัปโหลดวิดีโอไม่สำเร็จ");
          }
        } else if (currentLesson.pendingDeleteVideoId) {
          newLessons[activeLessonIndex].videos = [];
          newLessons[activeLessonIndex].pendingDeleteVideoId = null;
        }

        if (currentLesson.documentFile) {
          try {
            const up = await uploadMaterial(
              chapterId,
              "document",
              currentLesson.documentFile,
              currentLesson.documentFile.name
            );
            newLessons[activeLessonIndex].documents = [up];
            newLessons[activeLessonIndex].documentFile = null;
            newLessons[activeLessonIndex].pendingDeleteDocumentId = null;
          } catch {
            toast.error("อัปโหลดเอกสารไม่สำเร็จ");
          }
        } else if (currentLesson.pendingDeleteDocumentId) {
          newLessons[activeLessonIndex].documents = [];
          newLessons[activeLessonIndex].pendingDeleteDocumentId = null;
        }

        setLessons(newLessons);
      }

      toast.success(`บันทึกข้อมูลบทที่ ${activeLessonIndex + 1} สำเร็จ!`);
      setIsLessonEditing(false);
      setIsDirty(false);
      setFieldErrors({});
    } else {
      if (lessons.length === 0) {
        toast.error("ไม่มีบทเรียนให้แก้ไข กรุณาเพิ่มบทเรียนก่อน");
        return;
      }
      setIsLessonEditing(true);
      toast(`คุณกำลังแก้ไขบทที่ ${activeLessonIndex + 1}`, { icon: "✍️" });
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleEditSaveLessonToggle();
  };

  const sensorsDnd = sensors;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((lesson) => lesson.id === active.id);
      const newIndex = lessons.findIndex((lesson) => lesson.id === over.id);
      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      const newlyActiveLessonId = lessons[activeLessonIndex].id;
      const updatedActiveIndex = newLessons.findIndex(
        (l) => l.id === newlyActiveLessonId
      );
      setActiveLessonIndex(updatedActiveIndex);

      try {
        await Promise.all(
          newLessons.map(async (_l, idx) => {
            const beId = beIdByIndex[idx];
            if (beId) await updateChapter(beId, { order: idx + 1 });
          })
        );
      } catch {
        toast.error("บันทึกลำดับไม่สำเร็จ");
      }
    }
  };

  const currentLesson = lessons[activeLessonIndex];
  if (!currentLesson)
    return (
      <div className="max-w-7xl mx-auto mt-8 p-5 text-center">Loading...</div>
    );

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteLesson}
        title="ยืนยันการลบ"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบบทเรียนที่ ${
          activeLessonIndex + 1
        } ?`}
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
        }}
      />

      <div className="w-full max-w-7xl mx-auto text-black mt-6 px-4 sm:px-6 lg:px-8 mb-10">
        <div className="mb-6">
          <span className="text-2xl font-semibold">จัดการบทเรียน</span>
          <div className="w-full mt-4">
            <DndContext
              sensors={sensorsDnd}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lessons.map((l) => l.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-4">
                  {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex flex-col gap-2">
                      <div className="py-2 px-3 bg-[#414E51] rounded-md text-white font-semibold text-sm text-center">
                        บทที่ {index + 1}
                      </div>
                      <SortableLessonTitleTab
                        id={lesson.id}
                        title={lesson.title}
                        active={activeLessonIndex === index}
                        disabled={isLessonEditing}
                        onClick={() => {
                          if (isLessonEditing) {
                            toast.error(
                              "กรุณาบันทึกบทเรียนปัจจุบันก่อนเปลี่ยนบท"
                            );
                            return;
                          }
                          setActiveLessonIndex(index);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleFormSubmit} noValidate>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-6">
            {/* ปุ่มย้อนกลับ */}
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
                isLessonEditing
                  ? "bg-[#31E3CB] text-black hover:bg-teal-400"
                  : "bg-[#2F88FC] text-black hover:bg-blue-600"
              }`}
            >
              {isLessonEditing ? "บันทึกบทเรียน" : "แก้ไขบทเรียน"}
            </button>

            {/* ลบได้ทุกโหมด */}
            <button
              type="button"
              onClick={handleDeleteLessonClick}
              className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold cursor-pointer hover:bg-gray-100"
            >
              <FaTrash className="inline-block mr-2" />
              ลบบทเรียน
            </button>

            <button
              type="button"
              onClick={addLesson}
              disabled={isLessonEditing}
              className="w-full sm:w-auto py-3 px-8 bg-[#31E3CB] text-black rounded-full border-none text-base font-semibold hover:bg-teal-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <FaPlus className="inline-block mr-2" />
              เพิ่มบทเรียน
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex flex-col gap-8">
              <div>
                <label
                  htmlFor="lessonTitle"
                  className="text-xl font-semibold mb-4 flex items-center gap-2"
                >
                  <FaPencilAlt className="text-gray-400" /> ชื่อบทเรียน
                </label>
                <input
                  type="text"
                  id="lessonTitle"
                  name="title"
                  value={currentLesson.title}
                  onChange={(e) => handleLessonChange(activeLessonIndex, e)}
                  placeholder="ชื่อบทเรียน"
                  disabled={!isLessonEditing}
                  data-field-error="title"
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? "err-title" : undefined}
                  className={`w-full p-3 border rounded-lg text-sm focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    fieldErrors.title
                      ? "border-red-500 focus:ring-2 focus:ring-red-300"
                      : "border-gray-300 focus:ring-1 focus:ring-gray-300"
                  }`}
                />
                {fieldErrors.title && (
                  <p id="err-title" className="mt-1 text-sm text-red-600">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lessonDescription"
                  className="text-xl font-semibold mb-4 block"
                >
                  คำอธิบายบทเรียน
                </label>
                <textarea
                  id="lessonDescription"
                  name="description"
                  value={currentLesson.description}
                  onChange={(e) => handleLessonChange(activeLessonIndex, e)}
                  placeholder="คำอธิบายบทเรียน"
                  disabled={!isLessonEditing}
                  data-field-error="description"
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={
                    fieldErrors.description ? "err-description" : undefined
                  }
                  className={`w-full p-3 border rounded-lg text-sm min-h-[125px] resize-y focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    fieldErrors.description
                      ? "border-red-500 focus:ring-2 focus:ring-red-300"
                      : "border-gray-300 focus:ring-1 focus:ring-gray-300"
                  }`}
                />
                {fieldErrors.description && (
                  <p id="err-description" className="mt-1 text-sm text-red-600">
                    {fieldErrors.description}
                  </p>
                )}
              </div>
            </div>

            {/* หน้าปก */}
            <div className="flex flex-col items-center lg:items-end">
              <label className="text-xl font-semibold mb-4 w-full lg:sr-only">
                ภาพหน้าปกบทเรียน
              </label>
              <div
                className={`w-full max-w-[540px] aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center font-semibold relative overflow-hidden ${
                  !isLessonEditing
                    ? "cursor-not-allowed bg-gray-100"
                    : "cursor-pointer bg-white hover:bg-gray-50"
                }`}
                onClick={() =>
                  isLessonEditing &&
                  document
                    .getElementById(`uploadInput-${activeLessonIndex}`)
                    ?.click()
                }
              >
                {currentLesson.imagePreview ? (
                  <img
                    src={currentLesson.imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FaPlus className="text-base text-gray-400" />
                    <span className="text-base font-semibold">
                      อัปโหลดภาพหน้าปกบทเรียน
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  id={`uploadInput-${activeLessonIndex}`}
                  className="hidden"
                  onChange={(e) => handleImageChange(activeLessonIndex, e)}
                  disabled={!isLessonEditing}
                />
              </div>
            </div>

            {/* ไฟล์วิดีโอ */}
            <FileUploadBox
              id={`video-upload-${activeLessonIndex}`}
              title="ไฟล์วิดีโอ"
              accept="video/*"
              disabled={!isLessonEditing}
              file={currentLesson.videoFile}
              onFileChange={(f) =>
                handleFileChange(activeLessonIndex, "videoFile", f)
              }
              existing={
                currentLesson.pendingDeleteVideoId
                  ? null
                  : currentLesson.videos?.[0] ?? null
              }
              pendingDelete={!!currentLesson.pendingDeleteVideoId}
              onMarkRemoveExisting={() => markRemoveExisting("video")}
              onUndoRemoveExisting={() => undoRemoveExisting("video")}
            />

            {/* เอกสารประกอบ */}
            <FileUploadBox
              id={`document-upload-${activeLessonIndex}`}
              title="เอกสารประกอบ"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
              disabled={!isLessonEditing}
              file={currentLesson.documentFile}
              onFileChange={(f) =>
                handleFileChange(activeLessonIndex, "documentFile", f)
              }
              existing={
                currentLesson.pendingDeleteDocumentId
                  ? null
                  : currentLesson.documents?.[0] ?? null
              }
              pendingDelete={!!currentLesson.pendingDeleteDocumentId}
              onMarkRemoveExisting={() => markRemoveExisting("document")}
              onUndoRemoveExisting={() => undoRemoveExisting("document")}
            />

            {/* ปุ่ม Assignment */}
            <div className="col-span-1 lg:col-span-2 flex justify-start items-center gap-4 mt-6 mb-7">
              <button
                type="button"
                onClick={() => {
                  const currentLessonId = lessons[activeLessonIndex]?.id;
                  if (courseId && currentLessonId)
                    router.push(
                      `/edit-assignment?courseId=${courseId}&lessonId=${currentLessonId}`
                    );
                  else toast.error("ไม่สามารถระบุ ID ของคอร์สหรือบทเรียนได้");
                }}
                disabled={isLessonEditing}
                title={
                  isLessonEditing
                    ? "กรุณาบันทึกบทเรียนก่อน"
                    : "จัดการ Assignment"
                }
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-8 bg-[#31E3CB] text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-teal-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <FaPlus className="inline-block mr-1" /> จัดการ Assignment
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default CourseLessonForm;
