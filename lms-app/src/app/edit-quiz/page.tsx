"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FaPlus,
  FaPen,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaTrash,
  FaArrowLeft,
  FaPlusCircle,
  FaSave,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { getCourseQuiz, upsertCourseQuiz } from "@/lib/quizApi";
import type { QuestionType } from "@/lib/quizApi";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type UiQuestionType = QuestionType | "";

// --- INTERFACES ---
interface Choice {
  id: number | string;
  text: string;
}

interface Question {
  id: number | string;
  type: UiQuestionType;
  title: string;
  choices: Choice[];
  textParts: string[];
  correctAnswers: string[];
  order?: number;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

// ===== helpers =====
const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random()}`;

// ===== helpers (วางไว้ใกล้ helper อื่นๆ ในไฟล์นี้) =====
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );

const isServerId = (id: unknown): boolean => {
  if (typeof id === "number" && Number.isFinite(id)) return true;
  if (typeof id === "string" && id && isUuid(id)) return true;
  return false;
};

// ถ้าต้องการคง id ของตัวเลือก (choice) ที่มาจาก backend จริงๆ ไว้
const pickChoiceOut = (c: { id: number | string; text: string }) =>
  isServerId(c.id) ? { id: c.id, text: c.text } : { text: c.text };
// type guard
const isOneOf = (t: UiQuestionType, arr: readonly QuestionType[]) =>
  t !== "" && arr.includes(t);

// ชุดชนิดที่ใช้บ่อย (แปะ as const ให้ TS แคบชนิดชัดเจน)
const TYPES_TITLE = [
  "multiple-choice",
  "multiple-response",
  "true-false",
  "sequencing",
  "matching",
] as const;

const TYPES_NEED_CHOICES_MIN2 = [
  "multiple-choice",
  "multiple-response",
  "sequencing",
  "matching",
] as const;

const TYPES_MC_TF_MULTI = [
  "multiple-choice",
  "true-false",
  "multiple-response",
] as const;

const TYPES_HAVE_CHOICES_SECTION = [
  "multiple-choice",
  "multiple-response",
  "sequencing",
] as const;

// ===== Modal =====
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-500" />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-4 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
          >
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Select-only Combobox Component ---
interface SelectComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SelectCombobox: React.FC<SelectComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayLabel =
    options.find((opt) => opt.value === value)?.label ||
    placeholder ||
    "-- กรุณาเลือก --";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="text-base w-full p-3 pr-5 border border-gray-300 rounded-lg bg-white text-left appearance-none disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer flex justify-between items-center"
      >
        <span className="text-black">{displayLabel}</span>
        <FaChevronDown
          className={`transition-transform duration-200 text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="p-3 text-sm text-black hover:bg-gray-100 cursor-pointer"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const questionTypeOptions = [
  { value: "multiple-choice", label: "ปรนัย (เลือกตอบข้อเดียว)" },
  { value: "multiple-response", label: "ปรนัย (เลือกตอบหลายข้อ)" },
  { value: "true-false", label: "ถูก-ผิด" },
  { value: "fill-in-the-blank", label: "เติมคำในช่องว่าง" },
  { value: "sequencing", label: "เรียงลำดับ" },
  { value: "matching", label: "จับคู่" },
];

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [numQuestionsInput, setNumQuestionsInput] = useState<string>("0");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 2;
  // ✅ ช่วยคำนวณจำนวนหน้าจากจำนวนข้อปัจจุบัน
  const totalPagesFromCount = (count: number) =>
    Math.max(1, Math.ceil(count / questionsPerPage));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<
    string | number | null
  >(null);
  const [loading, setLoading] = useState(false);
  const isLocked = loading || !isEditing;
  const [originalOrderMap, setOriginalOrderMap] = useState<
    Record<string | number, number>
  >({});

  // ✅ กันพลาดทุกกรณี: ถ้าจำนวนข้อเปลี่ยน ให้หด currentPage ให้ไม่เกินหน้าสุดท้ายเสมอ
  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPagesFromCount(questions.length)));
  }, [questions]);

  useEffect(() => {
    const id = searchParams.get("courseId");
    if (!id) {
      toast.error("ไม่พบ ID ของคอร์สใน URL");
      return;
    }
    setCourseId(id);

    (async () => {
      try {
        setLoading(true);
        const quiz = await getCourseQuiz(id);
        setQuizTitle(quiz.title ?? "");
        setQuestions(quiz.questions ?? []);
        setNumQuestionsInput(String(quiz.questions?.length ?? 0));

        // ✅ map order เดิมของแต่ละข้อ
        const m: Record<string | number, number> = {};
        for (const q of quiz.questions ?? []) {
          if (q?.id != null && typeof q.order === "number") {
            m[q.id] = q.order;
          }
        }
        setOriginalOrderMap(m);

        const hasData =
          (quiz.title?.trim() || "") !== "" ||
          (quiz.questions?.length ?? 0) > 0;
        setIsEditing(!hasData);
      } catch (e) {
        console.error("getCourseQuiz failed:", e);
        toast.error("โหลดแบบทดสอบไม่สำเร็จ");
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  // เพิ่มไว้ในฟังก์ชัน Page() ข้างบนๆ ใกล้ๆ hook อื่นๆ
  const smartBack = () => {
    // ถ้ายังอยู่โหมดแก้ไข ให้ถามยืนยันก่อน
    if (isEditing) {
      const ok = window.confirm(
        "คุณยังไม่ได้บันทึกการแก้ไข ต้องการออกจากหน้านี้หรือไม่?"
      );
      if (!ok) return;
    }

    // 1) ลองอ่านพารามิเตอร์ที่บอกว่าจะกลับไปที่ไหน
    const from = searchParams.get("from") || searchParams.get("returnTo");
    if (from) {
      try {
        const url = decodeURIComponent(from);
        if (url.startsWith("/")) {
          router.push(url);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // 2) ใช้ back ถ้ามี history
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    // 3) ลอง referrer ที่โดเมนเดียวกัน
    const ref = document.referrer;
    if (ref) {
      try {
        const u = new URL(ref);
        if (
          typeof window !== "undefined" &&
          u.origin === window.location.origin
        ) {
          router.push(`${u.pathname}${u.search}${u.hash}`);
          return;
        }
      } catch {
        /* ignore */
      }
    }

    // 4) fallback
    const fallback = courseId ? `/course/${courseId}` : "/my-courses";
    router.push(fallback);
  };

  const createNewQuestion = (id: number | string): Question => ({
    id,
    type: "",
    title: "",
    choices: [],
    textParts: [""],
    correctAnswers: [],
  });

  const updateQuestionList = (newCount: number) => {
    setQuestions((prev) => {
      const currentCount = prev.length;
      let next: Question[];

      if (newCount > currentCount) {
        next = [
          ...prev,
          ...Array.from({ length: newCount - currentCount }, () =>
            createNewQuestion(makeId())
          ),
        ];
      } else {
        next = prev.slice(0, newCount);
      }

      // ✅ หด currentPage ให้ไม่เกินหน้าสุดท้ายใหม่ทุกครั้งที่จำนวนข้อเปลี่ยน
      setCurrentPage((p) => {
        const last = totalPagesFromCount(next.length);
        return Math.min(p, last);
      });

      return next;
    });
  };

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumQuestionsInput(value);
    const parsed = parseInt(value, 10);
    const newCount = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    updateQuestionList(newCount);
  };

  const handleAddQuestion = () => {
    if (isLocked) return;
    setQuestions((prev) => {
      const next = [...prev, createNewQuestion(makeId())];
      setNumQuestionsInput(String(next.length)); // sync
      return next;
    });
  };
  const handleDeleteQuestion = (questionId: number | string) => {
    setQuestionToDelete(questionId);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete !== null) {
      setQuestions((prev) => {
        const next = prev.filter((q) => q.id !== questionToDelete);

        // sync กล่อง "จำนวนข้อ"
        setNumQuestionsInput(String(next.length));

        // ✅ ถ้าหน้าปัจจุบันเกินหน้าสุดท้ายใหม่ ให้หดกลับ
        setCurrentPage((p) => {
          const last = totalPagesFromCount(next.length);
          return Math.min(p, last);
        });

        return next;
      });
      toast.success("ลบคำถามเรียบร้อยแล้ว");
    }
    setIsModalOpen(false);
    setQuestionToDelete(null);
  };

  const handleQuestionDataChange = (
    questionId: number | string,
    field: "type" | "title",
    value: string
  ) => {
    const newType = value as UiQuestionType; // ✅ แคบชนิดครั้งเดียว

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          let updatedQuestion = { ...q, [field]: value };

          if (field === "type") {
            // ⬇️ ใช้ newType แทน value และกำหนด type ด้วย UiQuestionType
            updatedQuestion = { ...createNewQuestion(q.id), type: newType };

            if (isOneOf(newType, TYPES_HAVE_CHOICES_SECTION)) {
              updatedQuestion.choices = Array.from({ length: 4 }, () => ({
                id: makeId(),
                text: "",
              }));
            } else if (newType === "true-false") {
              updatedQuestion.choices = [
                { id: 1, text: "ถูก" },
                { id: 2, text: "ผิด" },
              ];
            } else if (newType === "matching") {
              updatedQuestion.choices = Array.from({ length: 3 }, () => ({
                id: makeId(),
                text: "",
              }));
              updatedQuestion.correctAnswers = Array(3).fill("");
            }

            // normalize fields by type
            if (newType === "multiple-choice" || newType === "true-false") {
              updatedQuestion.correctAnswers = [];
            } else if (newType === "multiple-response") {
              updatedQuestion.correctAnswers = [];
            } else if (newType === "sequencing") {
              updatedQuestion.correctAnswers = [];
            } else if (newType === "fill-in-the-blank") {
              updatedQuestion.textParts = [""];
              updatedQuestion.correctAnswers = [""];
            } else if (newType === "matching") {
              updatedQuestion.correctAnswers = Array(
                updatedQuestion.choices.length
              ).fill("");
            }
          }
          return updatedQuestion;
        }
        return q;
      })
    );
  };

  const handleChoiceTextChange = (
    questionId: number | string,
    choiceId: number | string,
    newText: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const oldText = q.choices.find((c) => c.id === choiceId)?.text || "";
          const updatedChoices = q.choices.map((c) =>
            c.id === choiceId ? { ...c, text: newText } : c
          );
          const updatedCorrectAnswers = q.correctAnswers.map((ans) =>
            ans === oldText ? newText : ans
          );
          return {
            ...q,
            choices: updatedChoices,
            correctAnswers: updatedCorrectAnswers,
          };
        }
        return q;
      })
    );
  };

  const handleAddChoice = (questionId: number | string) => {
    if (isLocked) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, choices: [...q.choices, { id: makeId(), text: "" }] }
          : q
      )
    );
  };

  const handleRemoveChoice = (
    questionId: number | string,
    choiceId: number | string
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const choiceToRemove = q.choices.find((c) => c.id === choiceId);
          const updatedChoices = q.choices.filter((c) => c.id !== choiceId);
          const updatedCorrectAnswers = q.correctAnswers.filter(
            (ans) => ans !== choiceToRemove?.text
          );
          return {
            ...q,
            choices: updatedChoices,
            correctAnswers: updatedCorrectAnswers,
          };
        }
        return q;
      })
    );
  };

  const handleCorrectAnswerChange = (
    questionId: number | string,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, correctAnswers: [value] } : q
      )
    );
  };

  const handleMultiCorrectAnswerChange = (
    questionId: number | string,
    answerText: string,
    isChecked: boolean
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              correctAnswers: isChecked
                ? [...q.correctAnswers, answerText]
                : q.correctAnswers.filter((ans) => ans !== answerText),
            }
          : q
      )
    );
  };

  const handleAddToSequence = (questionId: number | string, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId && !q.correctAnswers.includes(text)) {
          return { ...q, correctAnswers: [...q.correctAnswers, text] };
        }
        return q;
      })
    );
  };

  const handleRemoveFromSequence = (
    questionId: number | string,
    index: number
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newCorrectAnswers = [...q.correctAnswers];
          newCorrectAnswers.splice(index, 1);
          return { ...q, correctAnswers: newCorrectAnswers };
        }
        return q;
      })
    );
  };

  const handleMoveInSequence = (
    questionId: number | string,
    index: number,
    direction: "up" | "down"
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newCorrectAnswers = [...q.correctAnswers];
          const targetIndex = direction === "up" ? index - 1 : index + 1;
          if (targetIndex >= 0 && targetIndex < newCorrectAnswers.length) {
            [newCorrectAnswers[index], newCorrectAnswers[targetIndex]] = [
              newCorrectAnswers[targetIndex],
              newCorrectAnswers[index],
            ];
          }
          return { ...q, correctAnswers: newCorrectAnswers };
        }
        return q;
      })
    );
  };

  const handleAddMatchingPair = (questionId: number | string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newChoices = [...q.choices, { id: makeId(), text: "" }];
          const newCorrectAnswers = [...q.correctAnswers, ""];
          return {
            ...q,
            choices: newChoices,
            correctAnswers: newCorrectAnswers,
          };
        }
        return q;
      })
    );
  };

  const handleRemoveMatchingPair = (
    questionId: number | string,
    index: number
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          const newChoices = q.choices.filter((_, i) => i !== index);
          const newCorrectAnswers = q.correctAnswers.filter(
            (_, i) => i !== index
          );
          return {
            ...q,
            choices: newChoices,
            correctAnswers: newCorrectAnswers,
          };
        }
        return q;
      })
    );
  };

  const handleMatchingChange = (
    questionId: number | string,
    index: number,
    side: "prompt" | "option",
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId) {
          if (side === "prompt") {
            const newChoices = [...q.choices];
            if (newChoices[index]) {
              newChoices[index] = { ...newChoices[index], text: value };
            }
            return { ...q, choices: newChoices };
          } else {
            const newCorrectAnswers = [...q.correctAnswers];
            newCorrectAnswers[index] = value;
            return { ...q, correctAnswers: newCorrectAnswers };
          }
        }
        return q;
      })
    );
  };

  const handleAddBlank = (questionId: number | string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              textParts: [...q.textParts, ""],
              correctAnswers: [...q.correctAnswers, ""],
            }
          : q
      )
    );
  };

  const handleRemoveBlank = (questionId: number | string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? (() => {
              const newTextParts = [...q.textParts];
              const newCorrectAnswers = [...q.correctAnswers];
              newTextParts[index] += newTextParts.splice(index + 1, 1)[0] || "";
              newCorrectAnswers.splice(index, 1);
              return {
                ...q,
                textParts: newTextParts,
                correctAnswers: newCorrectAnswers,
              };
            })()
          : q
      )
    );
  };

  const handleTextPartChange = (
    questionId: number | string,
    index: number,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? (() => {
              const newTextParts = [...q.textParts];
              newTextParts[index] = value;
              return { ...q, textParts: newTextParts };
            })()
          : q
      )
    );
  };

  const handleFillInAnswerChange = (
    questionId: number | string,
    index: number,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? (() => {
              const newAnswers = [...q.correctAnswers];
              newAnswers[index] = value;
              return { ...q, correctAnswers: newAnswers };
            })()
          : q
      )
    );
  };

  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const questionsToShow = questions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );
  const goToNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleSaveChanges = async (): Promise<boolean> => {
    if (questions.length === 0) {
      toast.error("กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");
      return false;
    }

    // ====== validation (คง logic เดิม) ======
    if (!quizTitle.trim()) {
      toast.error('กรุณากรอก "ชื่อแบบทดสอบ"');
      const titleInput = document.querySelector(
        'input[placeholder="เช่น แบบทดสอบท้ายบทเรียน"]'
      );
      if (titleInput instanceof HTMLElement) titleInput.focus();
      return false;
    }

    let firstErrorIndex = -1;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let hasError = false;
      const filledChoices = q.choices.filter((c) => c.text.trim() !== "");

      if (!q.type) hasError = true;
      if (
        (
          [
            "multiple-choice",
            "multiple-response",
            "true-false",
            "sequencing",
            "matching",
          ] as const
        ).includes(q.type as any) &&
        !q.title.trim() &&
        q.type !== "fill-in-the-blank"
      )
        hasError = true;

      if (
        (
          [
            "multiple-choice",
            "multiple-response",
            "sequencing",
            "matching",
          ] as const
        ).includes(q.type as any) &&
        filledChoices.length < 2
      )
        hasError = true;

      if (
        (
          ["multiple-choice", "true-false", "multiple-response"] as const
        ).includes(q.type as any) &&
        q.correctAnswers.length === 0
      )
        hasError = true;

      if (
        q.type === "sequencing" &&
        filledChoices.length !== q.correctAnswers.length
      )
        hasError = true;

      if (q.type === "fill-in-the-blank") {
        const hasContent =
          q.textParts.some((p) => p.trim() !== "") ||
          q.correctAnswers.some((a) => a.trim() !== "");
        if (!hasContent) hasError = true;
        else if (
          q.correctAnswers.length > 0 &&
          q.correctAnswers.some((ans) => ans.trim() === "")
        )
          hasError = true;
      }

      if (q.type === "matching") {
        if (
          q.choices.some((c) => c.text.trim() === "") ||
          q.correctAnswers.some((ans) => ans.trim() === "")
        )
          hasError = true;
      }

      if (hasError) {
        firstErrorIndex = i;
        break;
      }
    }

    if (firstErrorIndex !== -1) {
      toast.error(
        `กรุณากรอกข้อมูลใน "คำถามข้อที่ ${firstErrorIndex + 1}" ให้ครบถ้วน`
      );
      const errorPage = Math.ceil((firstErrorIndex + 1) / 2); // questionsPerPage = 2
      setCurrentPage(errorPage);
      setTimeout(() => {
        const el = document.querySelector(
          '[required].invalid, [aria-invalid="true"]'
        ) as HTMLElement | null;
        (el ?? document.querySelector("form"))?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        el?.focus?.();
      }, 0);
      return false;
    }
    // =======================================

    if (!courseId) {
      toast.error("ไม่พบรหัสคอร์ส");
      return false;
    }

    try {
      setLoading(true);

      // 🔧 CHANGED: สร้าง payload ของคำถาม แล้ว "รีนัมเบอร์ order ใหม่เป็น 1..N" เสมอ
      let payloadQuestions = questions.map((q) => {
        // 1) choices: trim + กรองว่าง + unique (case-insensitive)
        const nonEmptyChoices = q.choices
          .map((c) => ({ ...c, text: c.text.trim() }))
          .filter((c) => c.text !== "");

        const seen = new Set<string>();
        const uniqueChoices = nonEmptyChoices.filter((c) => {
          const k = c.text.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        const choiceTexts = new Set(uniqueChoices.map((c) => c.text));

        // 2) correctAnswers: trim + validate ตามชนิด
        let normalizedCorrect = Array.from(
          new Set(q.correctAnswers.map((a) => a.trim()))
        );

        if (q.type === "multiple-choice" || q.type === "multiple-response") {
          normalizedCorrect = normalizedCorrect.filter((a) =>
            choiceTexts.has(a)
          );
          if (q.type === "multiple-choice") {
            normalizedCorrect = normalizedCorrect.slice(0, 1);
          }
        }

        if (q.type === "true-false") {
          const TF = ["ถูก", "ผิด"];
          normalizedCorrect = normalizedCorrect
            .filter((a) => TF.includes(a))
            .slice(0, 1);
        }

        if (q.type === "sequencing") {
          normalizedCorrect = normalizedCorrect.filter((a) =>
            choiceTexts.has(a)
          );
        }

        // 3) textParts: trim
        const textParts = q.textParts.map((t) => t.trim());

        // 4) fill-in-the-blank: ความยาวคำตอบ = #ช่องว่าง (= textParts.length - 1)
        if (q.type === "fill-in-the-blank") {
          const blanks = Math.max(0, textParts.length - 1);
          normalizedCorrect = normalizedCorrect
            .slice(0, blanks)
            .map((a) => a.trim());
          while (normalizedCorrect.length < blanks) normalizedCorrect.push("");
        }

        // 5) matching: ความยาวคำตอบ = จำนวนคู่ฝั่งซ้าย (หลังกรองว่าง)
        if (q.type === "matching") {
          const n = uniqueChoices.length;
          normalizedCorrect = normalizedCorrect
            .slice(0, n)
            .map((a) => a.trim());
          while (normalizedCorrect.length < n) normalizedCorrect.push("");
        }

        // 6) id (คง id ของข้อที่มาจาก server)
        const idOut = isServerId(q.id) ? q.id : undefined;

        // 7) choices output: ส่ง id เฉพาะตัวที่มาจาก server
        const choicesOut =
          q.type === "true-false"
            ? uniqueChoices.map((c) => ({ text: c.text }))
            : uniqueChoices.map(pickChoiceOut);

        // 8) payload ของคำถาม (order จะทับอีกทีด้านล่าง)
        const out = {
          type: q.type as QuestionType,
          title: (q.title || "").trim(),
          choices: choicesOut,
          textParts,
          correctAnswers: normalizedCorrect,
          order: Number(q.order ?? 0) || 0,
        } as any;

        if (idOut) out.id = idOut;
        return out;
      });

      // ✅ จุดสำคัญ: รีเซ็ตลำดับใหม่ตามตำแหน่งในอาเรย์ 1..N (กันชน uq_quiz_order)
      payloadQuestions = payloadQuestions.map((qq, idx) => ({
        ...qq,
        order: idx + 1,
      }));

      // (เลือกได้) log ดูค่า
      // console.table(payloadQuestions.map(({ id, order, type, title }: any) => ({ id: id ?? "(new)", order, type, title })));

      await upsertCourseQuiz(courseId, {
        title: quizTitle.trim(),
        questions: payloadQuestions,
      });

      toast.success("บันทึกแบบทดสอบสำเร็จ!");
      return true;
    } catch (e: any) {
      console.error("upsertCourseQuiz failed:", e?.response?.data || e);
      toast.error("บันทึกแบบทดสอบไม่สำเร็จ");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditMode = async () => {
    if (isEditing) {
      if (formRef.current && !formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }
      const success = await handleSaveChanges();
      if (success) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
      toast("เข้าสู่โหมดแก้ไข", { icon: "✏️" });
    }
  };

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(e) => e.preventDefault()}
      className="mx-auto max-w-7xl mt-[-8px] py-8 px-4 sm:px-6 lg:px-8 mb-10"
    >
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="ยืนยันการลบคำถาม"
        message="คุณแน่ใจหรือไม่ว่าต้องการลบคำถามข้อนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
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

      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-4">จัดการแบบทดสอบ</h1>

        {/* แถวปุ่มด้านขวา */}
        <div className="flex flex-col sm:flex-row sm:justify-end items-stretch sm:items-center gap-3">
          {/* ย้อนกลับ (outline) */}
          <button
            type="button"
            onClick={smartBack}
            className="w-full sm:w-auto py-3 px-8 bg-white text-black border border-gray-300 rounded-full text-base font-semibold hover:bg-gray-100"
            title="ย้อนกลับ"
          >
            <FaArrowLeft className="inline-block mr-2" />
            ย้อนกลับ
          </button>

          {/* เพิ่มคำถาม */}
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={isLocked}
            className="w-full sm:w-auto py-3 px-8 bg-[#31E3CB] text-black rounded-full border-none text-base cursor-pointer font-semibold hover:bg-teal-400 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <FaPlus className="inline-block mr-1" /> เพิ่มคำถาม
          </button>

          {/* แก้ไข/บันทึก */}
          <button
            type="button"
            onClick={handleToggleEditMode}
            disabled={loading}
            className={`w-full sm:w-auto text-base flex items-center justify-center font-semibold gap-2 px-8 py-3 rounded-full cursor-pointer ${
              isEditing
                ? "bg-[#31E3CB] text-black hover:bg-teal-400"
                : "bg-[#2F88FC] text-black hover:bg-blue-600"
            }`}
          >
            {isEditing ? <FaSave /> : <FaPen />}{" "}
            {isEditing ? "บันทึกการแก้ไข" : "แก้ไขคำถาม"}
          </button>

          {/* ตั้งค่าเกณฑ์วัดผล */}
          <button
            type="button"
            onClick={() =>
              router.push(`/edit-scoring-criteria?courseId=${courseId}`)
            }
            disabled={loading || isEditing || questions.length === 0}
            className="w-full sm:w-auto text-base flex items-center justify-center gap-2 px-8 py-3 bg-[#414E51] text-white rounded-full cursor-pointer hover:bg-[#2b3436] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FaCog /> ตั้งค่าเกณฑ์วัดผล
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4 flex-1">
          <label className="font-semibold text-base block shrink-0">
            ชื่อแบบทดสอบ
          </label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            disabled={isLocked}
            className="w-full text-base p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="เช่น แบบทดสอบท้ายบทเรียน"
            required
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="font-semibold text-base block shrink-0">
            จำนวนข้อ
          </label>
          <input
            type="number"
            value={numQuestionsInput}
            onChange={handleNumQuestionsChange}
            disabled={isLocked}
            className="w-full md:w-auto text-base p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="กรอกจำนวนข้อ"
            min="0"
            required
          />
        </div>
      </div>

      <hr className="border-t border-gray-200" />

      <div className="flex flex-col gap-8 mt-8">
        {questionsToShow.map((q, index) => (
          <React.Fragment key={q.id}>
            {index > 0 && <hr className="border-t" />}
            <div
              className={`flex flex-col gap-y-6 p-4 rounded-lg ${
                !isEditing ? "bg-gray-50" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <span className="text-lg font-semibold">
                  คำถามข้อที่ {(currentPage - 1) * questionsPerPage + index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  disabled={isLocked}
                  className="px-6 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto cursor-pointer"
                >
                  <FaTrash className="inline-block -mt-1 mr-2" />
                  ลบคำถามข้อนี้
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="font-semibold text-base shrink-0 sm:w-36">
                  ประเภทข้อสอบ
                </label>
                <SelectCombobox
                  value={q.type}
                  onChange={(value) =>
                    handleQuestionDataChange(q.id, "type", value)
                  }
                  disabled={isLocked}
                  options={questionTypeOptions}
                  placeholder="-- เลือกประเภทข้อสอบ --"
                />
              </div>

              {q.type && q.type !== "fill-in-the-blank" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  <label className="font-semibold text-base shrink-0 sm:w-36">
                    คำถาม
                  </label>
                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) =>
                      handleQuestionDataChange(q.id, "title", e.target.value)
                    }
                    disabled={isLocked}
                    placeholder="กรอกคำสั่งหรือคำถาม..."
                    className="w-full text-base p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              )}

              {q.type === "fill-in-the-blank" && (
                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-4">
                  <label className="font-semibold text-base shrink-0 sm:w-36 pt-3">
                    คำถาม
                  </label>
                  <div className="w-full flex flex-col gap-4">
                    {q.textParts.map((part, partIndex) => (
                      <div key={partIndex}>
                        <input
                          type="text"
                          value={part}
                          onChange={(e) =>
                            handleTextPartChange(
                              q.id,
                              partIndex,
                              e.target.value
                            )
                          }
                          disabled={isLocked}
                          placeholder={`ข้อความส่วนที่ ${partIndex + 1} ...`}
                          className="w-full text-sm p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {partIndex < q.correctAnswers.length && (
                          <div className="flex items-center gap-2 mt-3 sm:pl-8">
                            <span className="text-green-600 font-semibold">
                              └─›
                            </span>
                            <label className="text-gray-500 shrink-0 text-sm">
                              คำตอบ {partIndex + 1}:
                            </label>
                            <input
                              type="text"
                              value={q.correctAnswers[partIndex]}
                              onChange={(e) =>
                                handleFillInAnswerChange(
                                  q.id,
                                  partIndex,
                                  e.target.value
                                )
                              }
                              disabled={isLocked}
                              placeholder={`คำตอบที่ถูกต้อง ${partIndex + 1}`}
                              className="w-full text-sm p-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBlank(q.id, partIndex)}
                              disabled={isLocked}
                              className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddBlank(q.id)}
                      disabled={isLocked}
                      className="mt-2 self-start flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <FaPlus /> เพิ่มช่องว่าง
                    </button>
                  </div>
                </div>
              )}

              {q.type === "matching" && (
                <div className="w-full flex flex-col gap-4 sm:pl-40">
                  {q.choices.map((pair, pairIndex) => (
                    <div
                      key={pair.id}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4"
                    >
                      <input
                        type="text"
                        value={pair.text}
                        onChange={(e) =>
                          handleMatchingChange(
                            q.id,
                            pairIndex,
                            "prompt",
                            e.target.value
                          )
                        }
                        disabled={isLocked}
                        className="w-full text-base p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={`คำถามคู่ที่ ${pairIndex + 1}`}
                        required
                      />
                      <span className="text-gray-400 font-bold self-center">
                        =
                      </span>
                      <input
                        type="text"
                        value={q.correctAnswers[pairIndex] || ""}
                        onChange={(e) =>
                          handleMatchingChange(
                            q.id,
                            pairIndex,
                            "option",
                            e.target.value
                          )
                        }
                        disabled={isLocked}
                        className="w-full text-base p-3 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder={`คำตอบคู่ที่ ${pairIndex + 1}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveMatchingPair(q.id, pairIndex)
                        }
                        disabled={isLocked}
                        className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer self-center"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddMatchingPair(q.id)}
                    disabled={isLocked}
                    className="mt-2 self-start flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaPlus /> เพิ่มคู่
                  </button>
                </div>
              )}

              {isOneOf(q.type, TYPES_HAVE_CHOICES_SECTION) && (
                <div className="w-full flex flex-col gap-4 sm:pl-40">
                  <label className="text-left font-semibold text-gray-600">
                    {q.type === "sequencing"
                      ? "รายการตัวเลือกทั้งหมด (ยังไม่เรียงลำดับ)"
                      : "ตัวเลือกคำตอบ"}
                  </label>
                  {q.choices.map((choice, choiceIndex) => (
                    <div
                      key={choice.id}
                      className="flex-1 flex flex-col xs:flex-row items-start xs:items-center gap-2"
                    >
                      <label className="text-base text-gray-500 shrink-0 w-full xs:w-24">
                        {q.type === "sequencing"
                          ? `รายการ ${choiceIndex + 1}`
                          : `ตัวเลือกที่ ${choiceIndex + 1}`}
                      </label>
                      <div className="w-full flex items-center gap-2">
                        <input
                          type="text"
                          value={choice.text}
                          onChange={(e) =>
                            handleChoiceTextChange(
                              q.id,
                              choice.id,
                              e.target.value
                            )
                          }
                          disabled={isLocked}
                          className="w-full text-sm p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveChoice(q.id, choice.id)}
                          disabled={isLocked}
                          className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddChoice(q.id)}
                    disabled={isLocked}
                    className="mt-2 self-start flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FaPlus /> เพิ่มตัวเลือก
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="shrink-0 sm:w-36"></div>
                <div className="w-full">
                  {(q.type === "multiple-choice" || q.type === "true-false") &&
                    q.choices.filter((c) => c.text.trim() !== "").length >
                      0 && (
                      <div className="p-4 bg-[#1e2526] text-white rounded-xl">
                        <label className="block font-medium mb-3">
                          คำตอบที่ถูกต้อง
                        </label>
                        <SelectCombobox
                          value={q.correctAnswers[0] || ""}
                          onChange={(value) =>
                            handleCorrectAnswerChange(q.id, value)
                          }
                          disabled={isLocked}
                          options={q.choices
                            .filter((c) => c.text.trim() !== "")
                            .map((choice, choiceIndex) => ({
                              value: choice.text,
                              label:
                                q.type === "multiple-choice"
                                  ? `ตัวเลือกที่ ${choiceIndex + 1} : ${
                                      choice.text
                                    }`
                                  : choice.text,
                            }))}
                          placeholder="-- เลือกคำตอบ --"
                        />
                      </div>
                    )}

                  {q.type === "multiple-response" &&
                    q.choices.filter((c) => c.text.trim() !== "").length >
                      0 && (
                      <div className="p-4 bg-[#1e2526]  text-white rounded-xl">
                        <label className="block font-medium mb-3">
                          คำตอบที่ถูกต้อง (เลือกได้หลายข้อ)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.choices
                            .filter((c) => c.text.trim() !== "")
                            .map((choice) => (
                              <label
                                key={choice.id}
                                className={`flex items-center gap-3 p-3 bg-[#414E51] rounded-lg ${
                                  !isLocked
                                    ? "cursor-pointer hover:bg-black"
                                    : "cursor-not-allowed"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer"
                                  checked={q.correctAnswers.includes(
                                    choice.text
                                  )}
                                  disabled={isLocked}
                                  onChange={(e) =>
                                    handleMultiCorrectAnswerChange(
                                      q.id,
                                      choice.text,
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="truncate" title={choice.text}>
                                  {choice.text}
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}

                  {q.type === "sequencing" &&
                    q.choices.filter((c) => c.text.trim() !== "").length >
                      0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="flex flex-col gap-2 p-3 border rounded-lg">
                          <h4 className="font-semibold">ตัวเลือกทั้งหมด</h4>
                          <hr className="mb-2" />
                          {q.choices
                            .filter(
                              (c) =>
                                c.text.trim() &&
                                !q.correctAnswers.includes(c.text)
                            )
                            .map((choice) => (
                              <div
                                key={choice.id}
                                className="flex items-center justify-between bg-gray-100 p-2 rounded"
                              >
                                <span className="truncate" title={choice.text}>
                                  {choice.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAddToSequence(q.id, choice.text)
                                  }
                                  disabled={isLocked}
                                  className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  <FaPlusCircle />
                                </button>
                              </div>
                            ))}
                          {q.choices.filter(
                            (c) =>
                              c.text.trim() &&
                              !q.correctAnswers.includes(c.text)
                          ).length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                              ไม่มีตัวเลือกเหลืออยู่
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 p-3 bg-[#1e2526] text-white rounded-xl">
                          <h4 className="font-semibold">
                            กำหนดลำดับที่ถูกต้อง
                          </h4>
                          <hr className="mb-2 border-gray-600" />
                          {q.correctAnswers.map((answer, answerIndex) => (
                            <div
                              key={answerIndex}
                              className="flex items-center gap-2 bg-[#414E51]  p-2 rounded"
                            >
                              <span className="font-bold">
                                {answerIndex + 1}.
                              </span>
                              <span className="flex-1 truncate">{answer}</span>
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveInSequence(
                                      q.id,
                                      answerIndex,
                                      "up"
                                    )
                                  }
                                  disabled={answerIndex === 0 || isLocked}
                                  className="p-1 disabled:opacity-30 cursor-pointer"
                                >
                                  <FaChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleMoveInSequence(
                                      q.id,
                                      answerIndex,
                                      "down"
                                    )
                                  }
                                  disabled={
                                    answerIndex ===
                                      q.correctAnswers.length - 1 || isLocked
                                  }
                                  className="p-1 disabled:opacity-30 cursor-pointer"
                                >
                                  <FaChevronDown size={14} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFromSequence(q.id, answerIndex)
                                }
                                disabled={isLocked}
                                className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          ))}
                          {q.correctAnswers.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">
                              เพิ่มตัวเลือกจากด้านซ้าย
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 text-base">
          <button
            type="button"
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FaChevronLeft /> กลับไปยังหน้าก่อนหน้านี้
          </button>
          <span>
            หน้า {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            หน้าถัดไป <FaChevronRight />
          </button>
        </div>
      )}
    </form>
  );
};

export default Page;
