"use client";

import React, { useState, useEffect } from "react";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import api, { API_BASE } from "@/lib/api";

/* =========================
 * Config & Helpers
 * ========================= */

// ใช้ตัวเดียวกับฝั่งผู้สอน
const LIST_URL = "/api/documents/";

const toAbsolute = (u?: string | null) =>
  !u ? null : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`;

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// แก้เคสชื่อไฟล์ไทย / สระเพี้ยนเวลาดาวน์โหลด
function makeSafeFileName(name: string, fallback: string) {
  try {
    name = decodeURIComponent(name);
  } catch {}

  try {
    // @ts-ignore
    name = name.normalize("NFC");
  } catch {}

  const cleaned = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();

  const dot = cleaned.lastIndexOf(".");
  const base = dot > 0 ? cleaned.slice(0, dot) : cleaned;
  const ext = dot > 0 ? cleaned.slice(dot) : "";

  const safeBase = base.slice(0, 160);
  return (safeBase || fallback) + ext;
}

/* =========================
 * Types
 * ========================= */

interface DocumentItem {
  id: number;
  name: string;
  fileName: string;
  fileUrl: string | null;
  created_at: string | null;
}

/* =========================
 * Page Component
 * ========================= */

const UserImportantDocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get(LIST_URL);

      const raw = Array.isArray(res.data) ? res.data : res.data?.results ?? [];

      const mapped: DocumentItem[] = raw.map((it: any) => ({
        id: it.id,
        name: it.name ?? it.title ?? "-",
        fileName:
          it.fileName ??
          it.file_name ??
          it.filename ??
          it.name ??
          `document_${it.id}`,
        fileUrl:
          toAbsolute(
            it.fileUrl ??
              it.file ??
              it.document ??
              it.file_url ??
              it.url ??
              null
          ) ?? null,
        created_at: it.created_at ?? it.created ?? it.timestamp ?? null,
      }));

      // sort ใหม่ → เก่า
      mapped.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setDocuments(mapped);
    } catch (err: any) {
      console.error("loadDocuments error", err);
      alert(
        err?.response?.data?.detail || "โหลดรายการเอกสารสำคัญไม่สำเร็จ"
      );
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleViewFile = (fileUrl: string | null) => {
    const abs = toAbsolute(fileUrl ?? null);
    if (!abs) {
      alert("ไม่พบไฟล์สำหรับเอกสารนี้");
      return;
    }
    window.open(abs, "_blank", "noopener,noreferrer");
  };

  const handleDownloadFile = (doc: DocumentItem) => {
    const abs = toAbsolute(doc.fileUrl ?? null);
    if (!abs) {
      alert("ไม่พบไฟล์สำหรับเอกสารนี้");
      return;
    }

    const a = document.createElement("a");
    a.href = abs;
    a.download = makeSafeFileName(
      doc.fileName || `document_${doc.id}`,
      `document_${doc.id}`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const renderActionButtons = (doc: DocumentItem) => (
    <div className="flex justify-center items-center divide-x divide-gray-300">
      <button
        onClick={() => handleViewFile(doc.fileUrl)}
        className="flex items-center gap-1.5 px-3 cursor-pointer text-black"
        title="ดูไฟล์"
        type="button"
      >
        <EyeIcon className="w-5 h-5" />
        <span>ดูไฟล์</span>
      </button>
      <button
        onClick={() => handleDownloadFile(doc)}
        className="flex items-center gap-1.5 px-3 cursor-pointer text-black"
        title="ดาวน์โหลด"
        type="button"
      >
        <ArrowDownTrayIcon className="w-5 h-5" />
        <span>ดาวน์โหลด</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl sm:text-3xl font-semibold text-black">
          เอกสารสำคัญ
        </h1>
        <hr className="mt-[-6px] mb-8 border-t-2 border-gray-200" />

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-10 text-center text-gray-500">
            กำลังโหลด...
          </div>
        ) : documents.length > 0 ? (
          <div>
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300 w-16 text-black">
                      #
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300 text-black">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider border-r border-gray-300 text-black">
                      ชื่อเอกสาร
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-black">
                      ตัวเลือก
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc, index) => (
                    <tr key={doc.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300 text-black">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300 text-black">
                        {formatDate(doc.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-300 text-black">
                        <div className="flex items-center gap-3">
                          <DocumentTextIcon className="w-5 h-5 text-black" />
                          {doc.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-black">
                        {renderActionButtons(doc)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col gap-4">
              {documents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <DocumentTextIcon className="w-6 h-6 text-black flex-shrink-0" />
                      <span className="font-semibold text-lg break-words text-black">
                        {doc.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-gray-500 flex-shrink-0">
                        {formatDate(doc.created_at)}
                      </span>
                      <span className="text-xs text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    {renderActionButtons(doc)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-10 text-center text-gray-500">
            ยังไม่มีเอกสารสำคัญ
          </div>
        )}
      </div>
    </div>
  );
};

export default UserImportantDocumentsPage;
