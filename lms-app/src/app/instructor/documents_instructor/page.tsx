"use client";

import React, { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import api, { API_BASE, getAuthUser } from "@/lib/api";

/* =======================
 * API paths
 * ======================= */
const LIST_URL = "/api/documents/"; // อ่านได้ทุกคน
const INSTRUCTOR_BASE = "/api/instructor/documents/"; // ผู้สอน
const ADMIN_BASE = "/api/admin/documents/"; // แอดมิน (fallback)
const insDetail = (id: number | string) => `${INSTRUCTOR_BASE}${id}/`;
const admDetail = (id: number | string) => `${ADMIN_BASE}${id}/`;

const toAbsolute = (u?: string | null) =>
  !u ? null : /^https?:\/\//.test(u) ? u : `${API_BASE}${u}`;

const MUTATE_BASE = "/api/instructor/documents/";

/* =======================
 * Types
 * ======================= */
interface Document {
  id: number;
  name: string;
  fileName: string;
  fileUrl: string | null;
  created_at: string | null;
}

/* =======================
 * Confirmation Modal
 * ======================= */
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
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
            type="button"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`py-2 px-4 text-white rounded-lg font-semibold ${confirmButtonColor}`}
            type="button"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/* =======================
 * Page
 * ======================= */
const ImportantDocumentsPage: React.FC = () => {
  const MAX_NAME_LENGTH = 50;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ ใช้ state นี้จริง ๆ เพื่อกันกดซ้ำ
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingDocName, setEditingDocName] = useState("");

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [newDocName, setNewDocName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation states
  const [newDocNameError, setNewDocNameError] = useState("");
  const [selectedFileError, setSelectedFileError] = useState("");

  // ใครทำได้บ้าง: ผู้สอน + แอดมิน (รวม superuser)
  const [canMutate, setCanMutate] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const u = await getAuthUser();
        const role = (u.role || u.role_name || "").toString().toUpperCase();
        const allowed =
          !!(
            u.is_superuser ||
            u.is_staff ||
            u.is_instructor ||
            role === "INSTRUCTOR" ||
            role === "ADMIN"
          );
        setCanMutate(allowed);

        // optional: cache ไว้ใช้หน้าอื่น
        if (typeof window !== "undefined") {
          const me = JSON.parse(localStorage.getItem("me") || "null") || {};
          localStorage.setItem("me", JSON.stringify({ ...me, ...u }));
        }
      } catch {
        setCanMutate(false);
      }
    })();
  }, []);

  async function loadDocuments() {
  setLoading(true);
  try {
    const res = await api.get(LIST_URL);
    const raw = Array.isArray(res.data) ? res.data : res.data?.results ?? [];

    const mapped: Document[] = raw.map((it: any) => ({
      id: it.id,
      name: it.name ?? it.title ?? "-",
      fileName: it.fileName ?? it.file_name ?? it.filename ?? it.name ?? "",
      fileUrl: toAbsolute(
        it.fileUrl ?? it.file ?? it.document ?? it.file_url ?? it.url ?? null
      ),
      created_at: it.created_at ?? it.created ?? it.timestamp ?? null,
    }));

    setDocuments(mapped);
  } catch (e) {
    console.error("loadDocuments failed:", e);
    setDocuments([]);
  } finally {
    setLoading(false);
  }
}


  useEffect(() => {
    loadDocuments();
  }, []);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    };
  }, [selectedFileUrl]);

  const handleOpenAddModal = () => {
    // ✅ รีเซ็ตสถานะส่งทุกครั้งที่เปิด modal
    setIsSubmitting(false);
    setNewDocName("");
    setSelectedFile(null);
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    setSelectedFileUrl("");
    // Reset validation errors
    setNewDocNameError("");
    setSelectedFileError("");
    setIsAddModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileUrl(URL.createObjectURL(file));
      // Clear validation error when file is selected
      setSelectedFileError("");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewDocName(value);
    // Clear validation error when user starts typing
    if (value.trim()) {
      setNewDocNameError("");
    }
  };

  const handleAddDocument = async () => {
    // ✅ กันการกดซ้ำตอนกำลังส่ง
    if (isSubmitting) return;

    // Validate fields
    let hasError = false;

    if (!newDocName.trim()) {
      setNewDocNameError("กรอกข้อมูลให้ครบ");
      hasError = true;
    } else {
      setNewDocNameError("");
    }

    if (!selectedFile) {
      setSelectedFileError("กรอกข้อมูลให้ครบ");
      hasError = true;
    } else {
      setSelectedFileError("");
    }

    if (hasError) return;

    const fd = new FormData();
    fd.append("name", newDocName.trim()); // ต้องเป็น name
    fd.append("file", selectedFile!);     // ต้องเป็น file (selectedFile is validated above)

    try {
      setIsSubmitting(true); // ✅ เริ่มส่ง

      await api.post(MUTATE_BASE, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`เพิ่มเอกสาร "${newDocName}" เรียบร้อยแล้ว`);
      setNewDocName("");
      setSelectedFile(null);
      if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl("");
      setIsAddModalOpen(false);
      await loadDocuments();
    } catch (e: any) {
      console.error("create failed:", e?.response?.data || e.message);
      toast.error(
        e?.response?.data?.detail ||
          e?.response?.data?.message ||
          "เพิ่มเอกสารไม่สำเร็จ"
      );
    } finally {
      setIsSubmitting(false); // ✅ จบการส่ง
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.name);
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
  };

  const handleSaveEdit = async (docId: number) => {
    if (!editingDocName.trim()) {
      toast.error("กรุณากรอกหัวข้อ");
      return;
    }
    try {
      try {
        await api.patch(insDetail(docId), { title: editingDocName.trim() });
      } catch (e: any) {
        const st = e?.response?.status;
        if (st === 403 || st === 404) {
          await api.patch(admDetail(docId), { title: editingDocName.trim() });
        } else {
          throw e;
        }
      }
      toast.success("แก้ไขเอกสารเรียบร้อยแล้ว");
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, name: editingDocName.trim() } : d
        )
      );
      setEditingDocId(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "แก้ไขชื่อไม่สำเร็จ");
    }
  };

  const handleDelete = (doc: Document) => {
    setConfirmationModal({
      isOpen: true,
      title: "ยืนยันการลบเอกสาร",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบเอกสาร "${doc.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      onConfirm: () => confirmDelete(doc),
    });
  };

  const confirmDelete = async (docToDelete: Document) => {
    try {
      try {
        await api.delete(insDetail(docToDelete.id));
      } catch (e: any) {
        const st = e?.response?.status;
        if (st === 403 || st === 404) {
          await api.delete(admDetail(docToDelete.id));
        } else {
          throw e;
        }
      }
      toast.success(`ลบเอกสาร "${docToDelete.name}" เรียบร้อยแล้ว`);
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "ลบเอกสารไม่สำเร็จ");
    } finally {
      setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleViewFile = (fileUrl: string | null) => {
    const abs = toAbsolute(fileUrl ?? null);
    if (!abs) {
      toast.error("ไม่พบไฟล์");
      return;
    }
    window.open(abs, "_blank", "noopener,noreferrer");
  };

  const renderActionButtons = (doc: Document) => (
    <div className="flex justify-center items-center divide-x divide-gray-300">
      {editingDocId === doc.id ? (
        <>
          <button
            onClick={() => handleSaveEdit(doc.id)}
            className="flex items-center gap-1.5 text-green-600 hover:text-green-800 px-3"
            title="บันทึก"
            type="button"
          >
            <CheckIcon className="w-5 h-5" />
            <span>บันทึก</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 px-3"
            title="ยกเลิก"
            type="button"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>ยกเลิก</span>
          </button>
        </>
      ) : canMutate ? (
        <>
          <button
            onClick={() => handleViewFile(doc.fileUrl)}
            className="flex items-center gap-1.5 px-3"
            title="ดูไฟล์"
            type="button"
          >
            <EyeIcon className="w-5 h-5" />
            <span>ดูไฟล์</span>
          </button>
          <button
            onClick={() => handleEdit(doc)}
            className="flex items-center gap-1.5 px-3"
            title="แก้ไข"
            type="button"
          >
            <PencilIcon className="w-5 h-5" />
            <span>แก้ไข</span>
          </button>
          <button
            onClick={() => handleDelete(doc)}
            className="flex items-center gap-1.5 px-3"
            title="ลบ"
            type="button"
          >
            <TrashIcon className="w-5 h-5" />
            <span>ลบ</span>
          </button>
        </>
      ) : (
        <button
          onClick={() => handleViewFile(doc.fileUrl)}
          className="flex items-center gap-1.5 px-3"
          title="ดูไฟล์"
          type="button"
        >
          <EyeIcon className="w-5 h-5" />
          <span>ดูไฟล์</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans antialiased">
      <Toaster position="top-center" />
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, isOpen: false })
        }
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            จัดการเอกสารสำคัญ
          </h1>
          {canMutate && (
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
              type="button"
            >
              <PlusCircleIcon className="w-6 h-6" />
              <span>เพิ่มเอกสาร</span>
            </button>
          )}
        </div>
        <hr className="mt-[-10px] mb-8 border-t-2 border-gray-200" />

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-10 text-center">
            กำลังโหลด...
          </div>
        ) : documents.length > 0 ? (
          <div className="bg-transparent">
            {/* Desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300">
                      #
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300">
                      ชื่อเอกสาร
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider">
                      การจัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc, index) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium border-r border-gray-300">
                        {editingDocId === doc.id ? (
                          <div>
                            <input
                              type="text"
                              value={editingDocName}
                              onChange={(e) =>
                                setEditingDocName(e.target.value)
                              }
                              maxLength={MAX_NAME_LENGTH}
                              className="w-full text-center border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                              autoFocus
                            />
                            <div
                              className={`text-xs text-right mt-2 ${
                                editingDocName.length >= MAX_NAME_LENGTH
                                  ? "text-red-500"
                                  : "text-black"
                              }`}
                            >
                              {editingDocName.length} / {MAX_NAME_LENGTH}
                            </div>
                          </div>
                        ) : (
                          doc.name
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {renderActionButtons(doc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex flex-col gap-4">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    {editingDocId === doc.id ? (
                      <div className="w-full pr-4">
                        <input
                          type="text"
                          value={editingDocName}
                          onChange={(e) => setEditingDocName(e.target.value)}
                          maxLength={MAX_NAME_LENGTH}
                          className="w-full font-semibold text-lg border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300"
                          autoFocus
                        />
                        <div
                          className={`text-xs text-right mt-2 ${
                            editingDocName.length >= MAX_NAME_LENGTH
                              ? "text-red-500"
                              : "text-black"
                          }`}
                        >
                          {editingDocName.length} / {MAX_NAME_LENGTH}
                        </div>
                      </div>
                    ) : (
                      <span className="font-semibold text-lg break-words pr-4">
                        {doc.name}
                      </span>
                    )}
                    <span className="text-sm ">#{index + 1}</span>
                    <span className="text-xs text-gray-500 block">
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    {renderActionButtons(doc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-10 text-center ">
            ยังไม่มีเอกสารสำคัญ
          </div>
        )}
      </div>

      {isAddModalOpen && canMutate && (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-xl font-semibold border-b pb-3">
              เพิ่มเอกสารใหม่
            </h3>
            <div className="space-y-2">
              <label htmlFor="docName" className="block font-medium">
                หัวข้อ
              </label>
              <input
                id="docName"
                type="text"
                value={newDocName}
                onChange={handleNameChange}
                maxLength={MAX_NAME_LENGTH}
                placeholder="เช่น เอกสารประกอบการเรียน"
                className={`w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  newDocNameError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-gray-300"
                }`}
              />
              {newDocNameError && (
                <p className="text-red-500 text-sm mt-1">{newDocNameError}</p>
              )}
              <div
                className={`text-sm text-right ${
                  newDocName.length >= MAX_NAME_LENGTH
                    ? "text-red-500"
                    : "text-black"
                }`}
              >
                {newDocName.length} / {MAX_NAME_LENGTH}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block font-medium">อัปโหลดไฟล์</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selectedFileError
                    ? "border-red-500 hover:border-red-600"
                    : "border-gray-300 hover:border-black"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 min-w-0 px-4">
                    <DocumentTextIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    <span
                      className="font-medium text-gray-800 truncate"
                      title={selectedFile.name}
                    >
                      {selectedFile.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                    <ArrowUpTrayIcon className="w-8 h-8" />
                    <span>เลือกไฟล์ที่ต้องการอัปโหลด</span>
                  </div>
                )}
              </div>
              {selectedFileError && (
                <p className="text-red-500 text-sm mt-1">{selectedFileError}</p>
              )}
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                type="button"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddDocument}
                disabled={isSubmitting}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                type="button"
              >
                {isSubmitting ? "กำลังอัปโหลด..." : "เพิ่มเอกสาร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportantDocumentsPage;
