// src/lib/assignmentApi.ts
import { api } from "@/lib/api";

export interface AssignmentDTO {
  id: string;
  course: string;
  lesson?: string | null;
  title: string;
  details: string; // maps to description
  assign_to_code?: string;
  due_at: string;
  attachments?: Array<{
    id: string;
    title: string;
    file_url: string | null;
    original_name?: string;
    content_type?: string;
  }>;
  created_at?: string;
}

const UUID36 = /^[0-9a-fA-F-]{36}$/;

/* ===============================
 * Helper: แปลงวันเวลาเป็น ISO (+07:00)
 * =============================== */
export function toISO(date: string, time: string) {
  if (!date) return "";
  const t = time || "00:00";
  return `${date}T${t}:00+07:00`;
}

/* ===============================
 * READ / LIST
 * =============================== */
export async function findAssignment(courseId: string, lessonId?: string) {
  const params: Record<string, any> = { course: courseId };
  if (lessonId && UUID36.test(lessonId)) params.lesson = lessonId;
  const res = await api.get("/api/assignments/", { params });
  const arr = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
  return (arr.length ? arr[0] : null) as AssignmentDTO | null;
}

/* ===============================
 * CREATE
 * =============================== */
export async function createAssignment(p: {
  courseId: string;
  lessonId?: string | null;
  title: string;
  details: string;
  assignToCode?: string;
  dueAtISO?: string;
  files?: File[];
}) {
  const fd = new FormData();
  fd.append("course", p.courseId);
  if (p.lessonId && UUID36.test(p.lessonId)) fd.append("lesson", p.lessonId);
  fd.append("title", p.title);
  fd.append("details", p.details);
  if (p.assignToCode) fd.append("assign_to_code", p.assignToCode);
  if (p.dueAtISO) fd.append("due_at", p.dueAtISO);
  (p.files ?? []).forEach((f) => fd.append("files", f, f.name));

  const res = await api.post("/api/assignments/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as AssignmentDTO;
}

/* ===============================
 * UPDATE (PATCH)
 * =============================== */
export async function updateAssignment(
  id: string,
  payload: {
    title: string;
    details: string;
    assignToCode?: string;
    dueAtISO: string;
  }
): Promise<AssignmentDTO> {
  const data: any = {
    title: payload.title,
    details: payload.details,
    due_at: payload.dueAtISO,
  };
  if (payload.assignToCode) {
    data.assign_to_code = payload.assignToCode;
  }

  // ใช้ PATCH ธรรมดา ไม่ต้องส่งไฟล์
  const res = await api.patch(`/api/assignments/${id}/`, data);
  return res.data;
}

/* ===============================
 * DELETE
 * =============================== */
export async function deleteAssignment(id: string) {
  await api.delete(`/api/assignments/${id}/`);
}

/* ===============================
 * ATTACHMENTS
 * =============================== */
export async function addAttachments(assignmentId: string, files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f, f.name));
  const res = await api.post(
    `/api/assignments/${assignmentId}/attachments/`,
    fd,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data as AssignmentDTO["attachments"];
}

export async function removeAttachment(assignmentId: string, fileId: string) {
  await api.delete(`/api/assignments/${assignmentId}/attachments/${fileId}/`);
}
