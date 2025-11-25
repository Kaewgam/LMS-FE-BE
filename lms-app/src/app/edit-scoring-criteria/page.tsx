"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FaPlus,
  FaTrash,
  FaPen,
  FaSave,
  FaExclamationTriangle,
  FaTimes,
  FaCertificate,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import {
  getCourseScoring,
  createCourseScoring,
  updateCourseScoring,
  type ScoringDTO,
  type ScoringItemDTO,
} from "@/lib/api";

type LocalCriterion = {
  id: number; // local running id สำหรับ UI
  _beId?: string; // uuid ของ backend (มีเมื่อเคยบันทึกแล้ว)
  description: string;
  correct: string;
  incorrect: string;
  score: string;
};

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
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

const Page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null); // null = ยังไม่เคยตั้งค่า
  const [criteria, setCriteria] = useState<LocalCriterion[]>([]);
  const [passScore, setPassScore] = useState<string>("0");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [criterionToDelete, setCriterionToDelete] = useState<number | null>(
    null
  );

  // ---------- helpers: map API <-> UI ----------
  const toUI = (dto: ScoringDTO) => {
    const items = [...(dto.items || [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    setCriteria(
      items.map((it, idx) => ({
        id: idx + 1,
        _beId: it.id,
        description: it.description ?? "",
        correct: String(it.correct ?? "0"),
        incorrect: String(it.incorrect ?? "0"),
        score: String(it.score ?? "0"),
      }))
    );
    setPassScore(String(dto.pass_score ?? 0));
    setScoringId(dto.id ?? null);
  };

  type ItemError = {
    description?: string;
    correct?: string;
    incorrect?: string;
    score?: string;
  };
  const errBorder = (has: boolean) =>
    `rounded-md border focus:outline-none ${
      has
        ? "border-red-500 focus:ring-1 focus:ring-red-500"
        : "border-gray-300 focus:ring-1 focus:ring-gray-300"
    }`;
  const [errors, setErrors] = useState<{
    items: ItemError[];
    pass_score?: string;
  }>({ items: [] });

  const toPayloadCreate = () => {
    // POST: ไม่ต้องส่ง id ของ item
    const items: Omit<ScoringItemDTO, "id">[] = criteria.map((c, i) => ({
      description: c.description.trim(),
      correct: Number(c.correct || 0),
      incorrect: Number(c.incorrect || 0),
      score: Number(c.score || 0),
      order: i + 1,
    }));
    return { pass_score: Number(passScore || 0), items };
  };

  const toPayloadUpdate = () => {
    // PUT: ส่งทั้งชุด ถ้ามี _beId ก็ส่งกลับเพื่อบอกว่าตัวไหนคงอยู่
    const items: ScoringItemDTO[] = criteria.map((c, i) => ({
      id: c._beId,
      description: c.description.trim(),
      correct: Number(c.correct || 0),
      incorrect: Number(c.incorrect || 0),
      score: Number(c.score || 0),
      order: i + 1,
    }));
    return { pass_score: Number(passScore || 0), items };
  };

  // ---------- load ----------
  useEffect(() => {
    const id = searchParams.get("courseId") || searchParams.get("id");
    setCourseId(id);
    if (!id) {
      setLoading(false);
      toast.error("ไม่พบ courseId");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const dto = await getCourseScoring(id);
        // ถ้ายังไม่เคยมี ให้ขึ้นโหมดแก้ไขพร้อมโครงว่าง 1 แถว
        if (!dto.id) {
          setCriteria([
            {
              id: 1,
              description: "",
              correct: "0",
              incorrect: "0",
              score: "0",
            },
          ]);
          setPassScore("0");
          setScoringId(null);
          setIsEditing(true);
        } else {
          toUI(dto);
          setIsEditing(false);
        }
      } catch (e: any) {
        const st = e?.response?.status;
        if (st === 401) {
          toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
          router.push("/login");
          return;
        }
        if (st === 403) toast.error("คุณไม่มีสิทธิ์แก้ไขเกณฑ์ของคอร์สนี้");
        else toast.error("โหลดเกณฑ์ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, router]);

  // ---------- UI handlers ----------
  const clampNumStr = (val: string) => String(Math.max(0, Number(val || 0)));

  const handleCriteriaChange = (
    id: number,
    field: keyof LocalCriterion,
    value: string
  ) => {
    setCriteria((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              [field]: field === "description" ? value : clampNumStr(value),
            }
          : c
      )
    );

    // เคลียร์ error ของช่องที่แก้
    setErrors((prev) => {
      const copy = { ...prev, items: [...(prev.items || [])] };
      const idx = criteria.findIndex((c) => c.id === id);
      if (idx >= 0) {
        copy.items[idx] = { ...(copy.items[idx] || {}) };
        // @ts-ignore
        delete copy.items[idx][field as keyof ItemError];
      }
      return copy;
    });
  };

  const addCriterion = () => {
    const newId =
      criteria.length > 0 ? Math.max(...criteria.map((c) => c.id)) + 1 : 1;
    setCriteria([
      ...criteria,
      { id: newId, description: "", correct: "0", incorrect: "0", score: "0" },
    ]);
  };

  const handleDeleteCriterion = (id: number) => {
    if (criteria.length <= 1 && isEditing) {
      toast.error("ต้องมีเกณฑ์การให้คะแนนอย่างน้อย 1 ข้อ");
      return;
    }
    setCriterionToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (criterionToDelete !== null) {
      setCriteria((prev) => {
        const next = prev.filter((c) => c.id !== criterionToDelete);
        return next.map((c, i) => ({ ...c, id: i + 1 })); // รีเลข local id ให้เรียงใหม่
      });
      toast.success("ลบเกณฑ์เรียบร้อยแล้ว");
    }
    setIsModalOpen(false);
    setCriterionToDelete(null);
  };

  // ---------- validate + save ----------
  const validateForm = (): boolean => {
    const itemErrs: ItemError[] = [];
    let total = 0;

    criteria.forEach((c, i) => {
      const e: ItemError = {};
      if (!c.description.trim()) e.description = "กรอกไม่ครบ";
      if (c.correct === "" || Number.isNaN(Number(c.correct)))
        e.correct = "กรอกไม่ครบ";
      else if (Number(c.correct) < 0) e.correct = "ต้องเป็นตัวเลข 0 ขึ้นไป";

      if (c.incorrect === "" || Number.isNaN(Number(c.incorrect)))
        e.incorrect = "กรอกไม่ครบ";
      else if (Number(c.incorrect) < 0) e.incorrect = "ต้องเป็นตัวเลข 0 ขึ้นไป";

      if (c.score === "" || Number.isNaN(Number(c.score)))
        e.score = "กรอกไม่ครบ";
      else if (Number(c.score) < 0) e.score = "ต้องเป็นตัวเลข 0 ขึ้นไป";

      total += Number(c.score || 0);
      itemErrs[i] = e;
    });

    let passErr: string | undefined;
    if (String(passScore).trim() === "" || Number.isNaN(Number(passScore)))
      passErr = "กรอกไม่ครบ";
    else if (Number(passScore) < 0) passErr = "ต้องเป็นตัวเลข 0 ขึ้นไป";
    else if (total > 0 && Number(passScore) > total)
      passErr = `ต้องไม่เกินคะแนนเต็มรวม (${total})`;

    setErrors({ items: itemErrs, pass_score: passErr });

    const hasItemErr = itemErrs.some((e) => Object.values(e).some(Boolean));
    const hasErr = hasItemErr || !!passErr;

    if (hasErr) {
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>('[data-error="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      toast.error("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
    }
    return !hasErr;
  };

  const handleSaveChanges = async (): Promise<boolean> => {
    if (!validateForm()) return false;
    if (!courseId) {
      toast.error("ไม่พบ courseId");
      return false;
    }
    const tid = toast.loading("กำลังบันทึก...");
    setSaving(true);
    try {
      if (!scoringId) {
        const dto = await createCourseScoring(courseId, toPayloadCreate());
        toUI(dto);
      } else {
        const dto = await updateCourseScoring(courseId, toPayloadUpdate());
        toUI(dto);
      }
      setErrors({ items: [], pass_score: undefined });
      toast.success("บันทึกเกณฑ์สำเร็จ!", { id: tid });
      return true;
    } catch (e: any) {
      const st = e?.response?.status;
      if (st === 401) {
        toast.error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", { id: tid });
        router.push("/login");
      } else if (st === 403) {
        toast.error("คุณไม่มีสิทธิ์แก้ไขเกณฑ์ของคอร์สนี้", { id: tid });
      } else {
        toast.error(e?.response?.data?.detail || "บันทึกไม่สำเร็จ", {
          id: tid,
        });
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEditMode = async () => {
    if (isEditing) {
      const ok = await handleSaveChanges();
      if (ok) setIsEditing(false);
    } else {
      setIsEditing(true);
      toast("เข้าสู่โหมดแก้ไข", { icon: "✏️" });
    }
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleToggleEditMode();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleFormSubmit}
      className="mx-auto max-w-7xl mt-[-8px] py-8 px-4 sm:px-6 lg:px-8 mb-10"
    >
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบเกณฑ์"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบเกณฑ์นี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
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

      <h1 className="text-2xl sm:text-2xl font-semibold mb-4">
        เกณฑ์การให้คะแนน
      </h1>

      {/* Back */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-50"
          title="ย้อนกลับ"
        >
          ← ย้อนกลับ
        </button>
      </div>

      {/* Table (md+) */}
      <div className="hidden md:block border border-gray-300 rounded-lg overflow-hidden">
        {/* หัวตาราง */}
        <div className="grid grid-cols-[2fr_2fr_1fr] text-lg lg:text-xl bg-[#414E51] text-white font-semibold text-center">
          <div className="p-4 border-r border-gray-600">เกณฑ์การให้คะแนน</div>
          <div className="p-4 border-r border-gray-600">การให้คะแนน</div>
          <div className="p-4">คะแนนที่ได้</div>
        </div>

        {/* แถวข้อมูล */}
        <div>
          {criteria.map((c, idx) => {
            const err = errors.items[idx] || {};
            return (
              <div
                key={c.id}
                className={`grid grid-cols-[2fr_2fr_1fr] items-start border-b border-gray-200 last:border-b-0 ${
                  !isEditing ? "bg-gray-50" : ""
                }`}
              >
                {/* col 1: description + ปุ่มลบ */}
                <div className="px-4 py-4 border-r border-gray-300 h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="คำอธิบายการให้คะแนน"
                        value={c.description}
                        onChange={(e) =>
                          handleCriteriaChange(
                            c.id,
                            "description",
                            e.target.value
                          )
                        }
                        disabled={!isEditing}
                        data-error={err.description ? "true" : "false"}
                        aria-invalid={!!err.description}
                        className={`w-full text-base p-2 font-semibold ${errBorder(
                          !!err.description
                        )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      />
                      {err.description && (
                        <p className="mt-1 text-sm text-red-600">
                          {err.description}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCriterion(c.id)}
                      disabled={!isEditing}
                      className="text-red-500 hover:text-red-700 p-2 transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="ลบเกณฑ์นี้"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>

                {/* col 2: correct / incorrect */}
                <div className="px-4 py-4 border-r border-gray-300 h-full">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step={1}
                        value={c.correct}
                        onChange={(e) =>
                          handleCriteriaChange(c.id, "correct", e.target.value)
                        }
                        disabled={!isEditing}
                        data-error={err.correct ? "true" : "false"}
                        aria-invalid={!!err.correct}
                        className={`w-full text-base p-2 text-center font-semibold ${errBorder(
                          !!err.correct
                        )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      />
                      <p className="text-sm font-semibold mt-2">คำตอบถูกต้อง</p>
                      {err.correct && (
                        <p className="mt-1 text-sm text-red-600">
                          {err.correct}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step={1}
                        value={c.incorrect}
                        onChange={(e) =>
                          handleCriteriaChange(
                            c.id,
                            "incorrect",
                            e.target.value
                          )
                        }
                        disabled={!isEditing}
                        data-error={err.incorrect ? "true" : "false"}
                        aria-invalid={!!err.incorrect}
                        className={`w-full text-base p-2 text-center font-semibold ${errBorder(
                          !!err.incorrect
                        )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                      />
                      <p className="text-sm font-semibold mt-2">คำตอบที่ผิด</p>
                      {err.incorrect && (
                        <p className="mt-1 text-sm text-red-600">
                          {err.incorrect}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* col 3: score */}
                <div className="px-4 py-4 h-full">
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step={1}
                      value={c.score}
                      onChange={(e) =>
                        handleCriteriaChange(c.id, "score", e.target.value)
                      }
                      disabled={!isEditing}
                      data-error={err.score ? "true" : "false"}
                      aria-invalid={!!err.score}
                      className={`w-24 p-2 text-center font-semibold text-base ${errBorder(
                        !!err.score
                      )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    <p className="text-sm font-semibold mt-2">คะแนน</p>
                    {err.score && (
                      <p className="mt-1 text-sm text-red-600 text-center">
                        {err.score}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ปุ่มเพิ่มแถว */}
        <button
          type="button"
          onClick={addCriterion}
          disabled={!isEditing}
          className="hidden md:flex items-center font-semibold text-base justify-center w-full p-4 border-t border-gray-300 hover:bg-gray-50 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-b-lg"
        >
          <FaPlus className="mr-2" />
          <span>เพิ่มเกณฑ์การให้คะแนน</span>
        </button>
      </div>

      {/* Card (sm) */}
      <div className="md:hidden space-y-4">
        {criteria.map((c, idx) => {
          const err = errors.items[idx] || {};
          return (
            <div
              key={c.id}
              className={`border border-gray-200 rounded-lg p-4 space-y-4 ${
                !isEditing ? "bg-gray-50" : "bg-white"
              }`}
            >
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  เกณฑ์การให้คะแนน
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="คำอธิบาย"
                      value={c.description}
                      onChange={(e) =>
                        handleCriteriaChange(
                          c.id,
                          "description",
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      data-error={err.description ? "true" : "false"}
                      aria-invalid={!!err.description}
                      className={`w-full font-semibold text-base p-2 ${errBorder(
                        !!err.description
                      )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    {err.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {err.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCriterion(c.id)}
                    disabled={!isEditing}
                    className="text-red-500 hover:text-red-700 p-2 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="ลบเกณฑ์นี้"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    คำตอบถูกต้อง
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step={1}
                    value={c.correct}
                    onChange={(e) =>
                      handleCriteriaChange(c.id, "correct", e.target.value)
                    }
                    disabled={!isEditing}
                    data-error={err.correct ? "true" : "false"}
                    aria-invalid={!!err.correct}
                    className={`w-full text-base p-2 text-center font-semibold ${errBorder(
                      !!err.correct
                    )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  {err.correct && (
                    <p className="mt-1 text-sm text-red-600">{err.correct}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    คำตอบที่ผิด
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step={1}
                    value={c.incorrect}
                    onChange={(e) =>
                      handleCriteriaChange(c.id, "incorrect", e.target.value)
                    }
                    disabled={!isEditing}
                    data-error={err.incorrect ? "true" : "false"}
                    aria-invalid={!!err.incorrect}
                    className={`w-full text-base p-2 text-center font-semibold ${errBorder(
                      !!err.incorrect
                    )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  {err.incorrect && (
                    <p className="mt-1 text-sm text-red-600">{err.incorrect}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  คะแนนที่ได้
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step={1}
                  value={c.score}
                  onChange={(e) =>
                    handleCriteriaChange(c.id, "score", e.target.value)
                  }
                  disabled={!isEditing}
                  data-error={err.score ? "true" : "false"}
                  aria-invalid={!!err.score}
                  className={`w-full text-base p-2 text-center font-semibold ${errBorder(
                    !!err.score
                  )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
                />
                {err.score && (
                  <p className="mt-1 text-sm text-red-600">{err.score}</p>
                )}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addCriterion}
          disabled={!isEditing}
          className="flex items-center font-semibold text-base justify-center w-full p-3 mt-4 border border-dashed border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          <FaPlus className="mr-2" />
          <span>เพิ่มเกณฑ์การให้คะแนน</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-8">
        <label className="text-lg sm:text-xl font-semibold shrink-0">
          เงื่อนไขผ่านเกณฑ์
        </label>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex flex-col">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step={1}
              placeholder="คะแนน"
              value={passScore}
              onChange={(e) => {
                setPassScore(clampNumStr(e.target.value));
                setErrors((prev) => ({ ...prev, pass_score: undefined }));
              }}
              disabled={!isEditing}
              data-error={errors.pass_score ? "true" : "false"}
              aria-invalid={!!errors.pass_score}
              className={`w-28 sm:w-48 p-3 text-lg sm:text-xl font-semibold text-center ${errBorder(
                !!errors.pass_score
              )} disabled:bg-gray-100 disabled:cursor-not-allowed`}
            />
            {errors.pass_score && (
              <p className="mt-1 text-sm text-red-600 text-center">
                {errors.pass_score}
              </p>
            )}
          </div>
          <label className="text-lg sm:text-xl font-semibold whitespace-nowrap">
            คะแนน มีสิทธิ์ได้รับใบประกาศนียบัตร
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-4 mt-10 mb-10">
        <button
          type="submit"
          disabled={saving}
          className={`w-full sm:w-auto py-3 px-8 rounded-full border-none text-base cursor-pointer font-semibold transition-colors ${
            isEditing
              ? "bg-[#31E3CB] text-black hover:bg-teal-400"
              : "bg-[#2F88FC] text-black hover:bg-blue-600"
          } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isEditing ? (
            <div className="flex items-center justify-center gap-2">
              <FaSave /> {saving ? "กำลังบันทึก..." : "บันทึก"}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <FaPen /> แก้ไขเกณฑ์
            </div>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!courseId) {
              toast.error("ไม่พบ courseId");
              return;
            }
            router.push(`/edit-certificate?courseId=${courseId}`);
          }}
          disabled={isEditing}
          className="w-full sm:w-auto py-3 px-8 bg-yellow-400 text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-yellow-500 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          title={
            isEditing ? "กรุณาบันทึกเกณฑ์ก่อน" : "ไปที่หน้าตั้งค่าประกาศนียบัตร"
          }
        >
          <div className="flex items-center justify-center gap-2">
            <FaCertificate /> ตั้งค่าประกาศนียบัตร
          </div>
        </button>
      </div>
    </form>
  );
};

export default Page;
