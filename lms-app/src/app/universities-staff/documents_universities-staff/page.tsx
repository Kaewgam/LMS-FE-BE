'use client';

import api from "@/lib/api";
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

// --- Interface & Component ที่ใช้ซ้ำ ---

// Interface สำหรับข้อมูลเอกสาร
interface Document {
  id: number;
  name: string;
  fileName: string;
  fileUrl: string | null; // อาจเป็น null ได้
  created_at: string; // มาจาก backend (snake_case)
}

// Component สำหรับ Pop up ยืนยัน (ConfirmationModal)
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
    <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-40 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors cursor-pointer ${confirmButtonColor}`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Component หลักของหน้า ---

const ImportantDocumentsPage: React.FC = () => {
  const MAX_NAME_LENGTH = 50; // กำหนดค่าสูงสุดของชื่อเอกสาร

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);


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


  // [ADD]
async function loadDocuments() {
  setLoading(true);
  try {
    const res = await api.get('/admin/documents/');   // ใช้ endpoint ฝั่งแอดมิน
    setDocuments(res.data as Document[]);
  } catch (e: any) {
    console.error(e);
    toast.error(e?.response?.data?.detail || 'โหลดรายการเอกสารไม่สำเร็จ');
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  loadDocuments();
}, []);


  const handleOpenAddModal = () => {
    setNewDocName("");
    setSelectedFile(null);
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    setSelectedFileUrl("");
    setIsAddModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileUrl(URL.createObjectURL(file));
    }
  };

  const handleAddDocument = async () => {
  if (!newDocName.trim() || !selectedFile) {
    toast.error('กรุณากรอกหัวข้อและเลือกไฟล์');
    return;
  }

  const fd = new FormData();
  fd.append('name', newDocName);
  fd.append('file', selectedFile);

  try {
    await api.post('/admin/documents/', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    toast.success(`เพิ่มเอกสาร "${newDocName}" เรียบร้อยแล้ว`);

    // เคลียร์ฟอร์ม + ปิด modal
    setNewDocName('');
    setSelectedFile(null);
    if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl);
    setSelectedFileUrl('');
    setIsAddModalOpen(false);

    // โหลดรายการใหม่จากเซิร์ฟเวอร์
    await loadDocuments();
  } catch (e: any) {
    console.error(e);
    toast.error(e?.response?.data?.detail || 'เพิ่มเอกสารไม่สำเร็จ');
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
    toast.error('กรุณากรอกหัวข้อ');
    return;
  }
  try {
    await api.patch(`/admin/documents/${docId}/`, { name: editingDocName }); // ต้องมี JSONParser ใน viewset แล้ว
    toast.success('แก้ไขเอกสารเรียบร้อยแล้ว');
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, name: editingDocName } : d));
    setEditingDocId(null);
  } catch (e: any) {
    console.error(e);
    toast.error(e?.response?.data?.detail || 'แก้ไขชื่อไม่สำเร็จ');
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
    await api.delete(`/admin/documents/${docToDelete.id}/`);
    toast.success(`ลบเอกสาร "${docToDelete.name}" เรียบร้อยแล้ว`);
    setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
  } catch (e: any) {
    console.error(e);
    toast.error(e?.response?.data?.detail || 'ลบเอกสารไม่สำเร็จ');
  } finally {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }));
  }
};

  const handleViewFile = (fileUrl: string | null) => {
  if (!fileUrl) {
    toast.error('ไม่พบไฟล์');
    return;
  }
  window.open(fileUrl, '_blank', 'noopener,noreferrer');
};

  const renderActionButtons = (doc: Document) => (
    <div className="flex justify-center items-center divide-x divide-gray-300">
      {editingDocId === doc.id ? (
        <>
          <button
            onClick={() => handleSaveEdit(doc.id)}
            className="flex items-center gap-1.5 text-green-600 hover:text-green-800 px-3 cursor-pointer"
            title="บันทึก"
          >
            <CheckIcon className="w-5 h-5" />
            <span>บันทึก</span>
          </button>
          <button
            onClick={handleCancelEdit}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-800 px-3 cursor-pointer"
            title="ยกเลิก"
          >
            <XMarkIcon className="w-5 h-5" />
            <span>ยกเลิก</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleViewFile(doc.fileUrl)}
            className="flex items-center gap-1.5  transition-colors px-3 cursor-pointer"
            title="ดูไฟล์"
          >
            <EyeIcon className="w-5 h-5" />
            <span>ดูไฟล์</span>
          </button>
          <button
            onClick={() => handleEdit(doc)}
            className="flex items-center gap-1.5  transition-colors px-3 cursor-pointer"
            title="แก้ไข"
          >
            <PencilIcon className="w-5 h-5" />
            <span>แก้ไข</span>
          </button>
          <button
            onClick={() => handleDelete(doc)}
            className="flex items-center gap-1.5  transition-colors px-3 cursor-pointer"
            title="ลบ"
          >
            <TrashIcon className="w-5 h-5" />
            <span>ลบ</span>
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans antialiased">
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
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none cursor-pointer"
          >
            <PlusCircleIcon className="w-6 h-6" />
            <span>เพิ่มเอกสาร</span>
          </button>
        </div>

        {documents.length > 0 ? (
          <div className="bg-transparent">
            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300">
                      #
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

            {/* Mobile View: Cards */}
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

      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-40 p-4">
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
                onChange={(e) => setNewDocName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                placeholder="เช่น เอกสารประกอบการเรียน"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
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
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-black transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 min-w-0 px-4">
                    <DocumentTextIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                    <span
                      className="font-medium text-gray-800 truncate"
                      title={selectedFile.name} // เพิ่ม title เพื่อให้ user hover ดูชื่อเต็มได้
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
            </div>
            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAddDocument}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer"
              >
                เพิ่มเอกสาร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportantDocumentsPage;
