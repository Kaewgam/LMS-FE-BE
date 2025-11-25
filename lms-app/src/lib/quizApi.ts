// src/lib/quizApi.ts
import { api } from "@/lib/api";

/* ---------- FE types (เหมือนหน้า page.tsx เดิม) ---------- */
export interface Choice {
  id: number | string;
  text: string;
}
export type QuestionType =
  | "multiple-choice"
  | "multiple-response"
  | "true-false"
  | "fill-in-the-blank"
  | "sequencing"
  | "matching";

export interface Question {
  id: number | string;
  type: QuestionType;
  title: string;
  choices: Choice[];
  textParts: string[];
  correctAnswers: string[];
  order?: number;
}

export interface Quiz {
  id?: string | number | null;
  title: string;
  questions: Question[];
}

/* ---------- API payload types (snake_case) ---------- */
type ApiChoice = { id?: number | string; order?: number; text: string };
type ApiQuestion = {
  id?: number | string;
  order?: number;
  type: QuestionType;
  title: string;
  text_parts: string[];
  correct_answers: string[];
  choices: ApiChoice[];
};
type ApiQuiz = {
  id?: string | number | null;
  title: string;
  questions: ApiQuestion[];
};

/* ---------- mappers ---------- */
const toApi = (q: Quiz): ApiQuiz => ({
  id: q.id ?? undefined,
  title: q.title ?? "",
  questions: (q.questions ?? []).map((it, idx) => ({
    id: it.id ?? undefined,
    order: it.order ?? idx + 1,
    type: it.type,
    title: it.title ?? "",
    text_parts: it.textParts ?? [""],
    correct_answers: it.correctAnswers ?? [],
    choices: (it.choices ?? []).map((c, cIdx) => ({
      id: c.id ?? undefined,
      order: cIdx + 1,
      text: c.text ?? "",
    })),
  })),
});

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.random()}`;

const fromApi = (q: ApiQuiz | null | undefined): Quiz => ({
  id: q?.id ?? null,
  title: q?.title ?? "",
  questions: (q?.questions ?? []).map((it) => ({
    id: it.id ?? newId(), // << ใช้ helper
    order: it.order ?? 0,
    type: it.type,
    title: it.title ?? "",
    textParts: it.text_parts ?? [""],
    correctAnswers: it.correct_answers ?? [],
    choices: (it.choices ?? []).map((c) => ({
      id: c.id ?? newId(), // << ใช้ helper
      text: c.text ?? "",
    })),
  })),
});

/* ---------- endpoints ---------- */
const path = (courseId: string | number) => `/api/courses/${courseId}/quiz/`;

export async function getCourseQuiz(courseId: string | number): Promise<Quiz> {
  const res = await api.get<ApiQuiz>(path(courseId));
  return fromApi(res.data);
}

/** upsert ทั้งชุด: พยายาม PUT ก่อน, ถ้า backend ยังไม่มี → สร้างด้วย POST */
export async function upsertCourseQuiz(
  courseId: string | number,
  quiz: Quiz
): Promise<Quiz> {
  const payload = toApi(quiz);
  try {
    const res = await api.put<ApiQuiz>(path(courseId), payload);
    return fromApi(res.data);
  } catch (e: any) {
    const code = e?.response?.status;
    if (code === 404 || code === 405 || code === 409) {
      const res = await api.post<ApiQuiz>(path(courseId), payload);
      return fromApi(res.data);
    }
    throw e;
  }
}
