// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/* =======================
 * Base & Axios client
 * ======================= */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

console.log("[api] API_BASE =", API_BASE);

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: false,
});

// (optional) request logger
api.interceptors.request.use((cfg) => {
  // DEBUG: log method, url, headers
  console.log(
    "[api] ->",
    cfg.method?.toUpperCase(),
    cfg.baseURL,
    cfg.url,
    cfg.headers
  );
  return cfg;
});

/* =======================
 * Auth helpers
 * ======================= */
// ---- helper อ่าน token ปัจจุบันทุกครั้ง ----
function currentAuth(): { scheme: "Bearer"; token: string } | null {
  if (typeof window === "undefined") return null;

  // เคลียร์ key ค้างสมัย dj-rest-auth (กันโดนใช้ผิดโหมด)
  localStorage.removeItem("key");
  sessionStorage.removeItem("key");

  const access =
    sessionStorage.getItem("access") ||
    localStorage.getItem("access") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token");

  return access ? { scheme: "Bearer", token: access } : null;
}

const NO_AUTH_URLS = [
  "/api/auth/login/",
  "/api/auth/password/reset/",
  "/api/auth/password/reset/confirm/",
  "/api/auth/registration/",
  "/api/auth/google/token-login/",
  "/api/token/refresh/",
] as const;

function normalizePath(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url.replace(API_BASE, "");
    }
  }
  const q = url.indexOf("?");
  return q >= 0 ? url.slice(0, q) : url;
}
function isNoAuthUrl(url?: string) {
  const p = normalizePath(url);
  return NO_AUTH_URLS.some((u) => p.startsWith(u));
}

// ---- Request Interceptor ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {};
  if (isNoAuthUrl(config.url)) {
    // บังคับ “ไม่แนบ” Authorization สำหรับ URL กลุ่มนี้
    (config.headers as any).Authorization = undefined;
    return config;
  }
  const auth = currentAuth();
  (config.headers as any).Authorization = auth
    ? `${auth.scheme} ${auth.token}`
    : undefined;
  return config;
});

// ---- Auto-refresh เฉพาะกรณีใช้ JWT ----
let isRefreshing = false;
let waiters: Array<(t: string) => void> = [];

function getRefresh() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("refresh") || localStorage.getItem("refresh");
}
function setAccess(t: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("access", t);
  localStorage.setItem("access", t);
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const response = error.response;
    const config = error.config as InternalAxiosRequestConfig | undefined;

    if (
      response?.status === 401 &&
      config &&
      !(config as any)._retry &&
      !isNoAuthUrl(config.url)
    ) {
      const refresh = getRefresh();
      if (!refresh) return Promise.reject(error);
      (config as any)._retry = true;

      try {
        if (isRefreshing) {
          const newToken = await new Promise<string>((resolve) =>
            waiters.push(resolve)
          );
          (config.headers as any).Authorization = `Bearer ${newToken}`;
          return api(config);
        }
        isRefreshing = true;

        const res = await axios.post(
          `${API_BASE}/api/token/refresh/`,
          { refresh },
          { timeout: 10000 }
        );
        const newAccess = (res.data as any)?.access;
        if (!newAccess) throw new Error("No access token");

        setAccess(newAccess);
        (
          api.defaults.headers.common as any
        ).Authorization = `Bearer ${newAccess}`;

        waiters.forEach((fn) => fn(newAccess));
        waiters = [];
        isRefreshing = false;

        (config.headers as any).Authorization = `Bearer ${newAccess}`;
        return api(config);
      } catch (e) {
        isRefreshing = false;
        waiters = [];
        // ล้างทุกกุญแจ
        [
          "access",
          "refresh",
          "access_token",
          "refresh_token",
          "key",
          "me",
        ].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        delete (api.defaults.headers.common as any).Authorization;
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

/* =======================
 * Auth endpoints
 * ======================= */
export async function getAuthUser() {
  const r = await api.get("/api/auth/user/");
  return r.data as {
    pk: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string | null;
    role_name?: string | null;
    is_instructor?: boolean;
    is_student?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    groups?: string[];
    full_name?: string | null;
    profile_image_url?: string | null;
    bio?: string | null;
  };
}

export async function updateMe(
  payload: Partial<{ full_name: string; bio: string }>
) {
  const r = await api.patch("/api/auth/user/", payload);
  return r.data;
}

export async function updateProfileImage(file: File) {
  const fd = new FormData();
  fd.append("profile_image", file);
  const r = await api.patch("/api/auth/user/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data as { profile_image_url: string };
}

export async function changePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const r = await api.post("/api/auth/password/change/", payload);
  return r.data;
}

/* =======================
 * Educations
 * ======================= */
export type EducationDTO = {
  id: string;
  level: string;
  university: string;
  start_year: number;
  end_year: number | null;
};

export async function listEducations() {
  const r = await api.get("/api/my/educations/");
  return r.data as EducationDTO[];
}
export async function createEducation(payload: Omit<EducationDTO, "id">) {
  const r = await api.post("/api/my/educations/", payload);
  return r.data as EducationDTO;
}
export async function updateEducation(
  id: string,
  payload: Partial<Omit<EducationDTO, "id">>
) {
  const r = await api.patch(`/api/my/educations/${id}/`, payload);
  return r.data as EducationDTO;
}
export async function deleteEducation(id: string) {
  await api.delete(`/api/my/educations/${id}/`);
}

/* =======================
 * Teachings
 * ======================= */
export type TeachingDTO = {
  id: string;
  topic: string;
  description: string;
  start_year: number;
  end_year: number | null; // null = "ปัจจุบัน"
};

export async function listTeachings() {
  const r = await api.get("/api/instructor/teachings/");
  return r.data as TeachingDTO[];
}
export async function createTeaching(payload: Omit<TeachingDTO, "id">) {
  const r = await api.post("/api/instructor/teachings/", payload);
  return r.data as TeachingDTO;
}
export async function updateTeaching(
  id: string,
  payload: Partial<Omit<TeachingDTO, "id">>
) {
  const r = await api.patch(`/api/instructor/teachings/${id}/`, payload);
  return r.data as TeachingDTO;
}
export async function deleteTeaching(id: string) {
  await api.delete(`/api/instructor/teachings/${id}/`);
}

export default api;

export async function logout() {
  const refresh =
    sessionStorage.getItem("refresh") || localStorage.getItem("refresh");
  try {
    if (refresh) {
      await api.post("/api/auth/logout/", { refresh });
    }
  } catch {}
  ["access", "refresh", "access_token", "refresh_token", "key", "me"].forEach(
    (k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    }
  );
}

/* =======================
 * Common DTOs
 * ======================= */
export interface UserMeDTO {
  id: string;
  email: string;
  full_name: string;
  university: string | null;
  university_id: string | null;
  // ⬇️ เพิ่มสองฟิลด์ที่หน้า Settings ใช้
  bio?: string | null;
  profile_image_url?: string | null;
}

export type CourseStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type CourseVisibility = "OPEN" | "CLOSED" | "HIDDEN";

export interface CourseDTO {
  id: string;
  title: string;
  description: string;
  banner_img: string | null;
  level: string | null;

  // ความสัมพันธ์หลัก ๆ จาก model
  curriculum: string | null; // uuid (pk ของ curriculum)
  instructor: string; // uuid (pk ของ instructor user)
  university: string | null; // uuid

  status: CourseStatus;
  visibility?: CourseVisibility; // บาง API ใช้ visibility แทน status

  created_at: string;
  updated_at: string;

  // ชื่อที่ serializer ส่งมาให้อ่านง่าย
  instructor_name?: string;
  curriculum_name?: string;

  // จาก CourseSerializer:
  //  'category', 'category_id', 'category_name',
  category?: string | null; // pk ของ category (UUID จาก source='category.id')
  category_id?: string | null; // pk ของ category (จาก field category_id)
  category_name?: string | null; // ชื่อหมวดหมู่ (source='category.name')

  // เวลาเรียนรวม (จาก "duration_hours")
  duration_hours?: number | null;
}

/* =======================
 * Me helper (smart-fallback)
 * ======================= */
function normalizeMe(raw: any): UserMeDTO {
  return {
    id: raw.id || raw.pk || raw.uuid,
    email: raw.email || raw.user?.email || "",
    full_name: raw.full_name || raw.name || raw.user?.full_name || "",
    university: raw.university?.name || raw.university || null,
    university_id: raw.university_id || raw.university?.id || null,
    bio: raw.bio ?? raw.motto ?? null,
    profile_image_url:
      raw.profile_image_url ??
      raw.avatar_url ??
      raw.profile_image ??
      raw.avatar ??
      null,
  };
}

export async function getMe(): Promise<UserMeDTO> {
  const override = (process.env.NEXT_PUBLIC_ME_PATH || "").trim();

  const candidates: string[] = [];
  if (override) {
    candidates.push(
      override.startsWith("/api")
        ? override
        : `/api${override.startsWith("/") ? "" : "/"}${override}`
    );
  }

  candidates.push(
    "/api/auth/user/",
    "/api/users/me/",
    "/api/instructor/me/",
    "/api/me/"
  );

  let lastErr: any = null;
  for (const p of candidates) {
    try {
      const { data } = await api.get(p);
      const me = normalizeMe(data);
      if (typeof window !== "undefined") {
        localStorage.setItem("me", JSON.stringify(me));
      }
      return me;
    } catch (err: any) {
      lastErr = err;
      const st = err?.response?.status;
      if (st === 401 || st === 403) throw err; // token ไม่ผ่านหยุดทันที
      // 404 → ลองตัวถัดไป
    }
  }
  throw lastErr ?? new Error("No /me route matched");
}

/* =======================
 * Courses: list (เดิม)
 * ======================= */
export async function listCourses(params?: {
  instructor?: string;
  status?: CourseStatus;
  q?: string;
}): Promise<CourseDTO[]> {
  const res = await api.get<CourseDTO[]>("/api/courses/", { params });
  return res.data;
}
export async function listMyCourses(): Promise<CourseDTO[]> {
  const me = await getMe();
  try {
    // ถ้าหลังบ้านรองรับ ?instructor=
    return await listCourses({ instructor: me.id });
  } catch {
    // fallback: ดึงทั้งหมดแล้วกรองที่ FE
    const all = await listCourses();
    return all.filter((c) => c.instructor === me.id);
  }
}

/* =======================
 * Courses: detail / update / delete (เพิ่มใหม่)
 * ======================= */

/** ปรับคีย์ตรงนี้ให้ตรงกับ BE ของคุณ */
const COURSE_API_CONFIG = {
  // BE ใช้ 'status' หรือ 'visibility' ให้เลือกอันที่จริง และอีกอันจะไม่ถูกส่ง
  statusField: "status" as "status" | "visibility",
  // ฟิลด์ไฟล์ภาพที่ BE รับ: 'banner_img' หรือ 'banner_image'
  bannerFileField: "banner_img" as "banner_img" | "banner_image",
};

export interface CourseDetailDTO {
  id: string;
  title: string;
  description: string | null;
  category?: string | null;
  code?: string | null;
  curriculum?: string | null;
  status?: string; // หรือ visibility แล้วแต่ฝั่ง BE
  banner_image_url?: string | null;
  image?: string | null;
  thumbnail?: string | null;
  banner?: string | null;
}

export async function getCourse(id: string): Promise<CourseDetailDTO> {
  const { data } = await api.get(`/api/courses/${id}/`);
  return data;
}

export type CourseUpdatePayload = {
  title?: string;
  description?: string;
  curriculum_id?: string | null;
  category_id?: string | null;
  enroll_token?: string;
  status?: string; // ถ้า BE ใช้ visibility ให้ใส่มาในคีย์นี้ไว้ แล้วเราจะ map ให้
  visibility?: "OPEN" | "CLOSED" | "HIDDEN";
  banner_img?: File | null; // หรือ banner_image (เราจะ map ให้อัตโนมัติ)
} & Record<string, any>;

/** อัปเดตคอร์ส – รองรับทั้ง FormData และ object */
export async function updateCourse(
  id: string,
  payload: FormData | CourseUpdatePayload
): Promise<CourseDetailDTO> {
  let body: FormData;

  if (payload instanceof FormData) {
    body = payload;
  } else {
    body = new FormData();
    if (payload.title != null) body.set("title", payload.title);
    if (payload.description != null)
      body.set("description", payload.description);
    if (payload.curriculum_id != null)
      body.set("curriculum_id", String(payload.curriculum_id));
    if (payload.category_id != null)
      body.set("category_id", String(payload.category_id));
    if (payload.enroll_token != null)
      body.set("enroll_token", payload.enroll_token);

    // ส่งเฉพาะฟิลด์สถานะที่กำหนดไว้ใน CONFIG
    if (COURSE_API_CONFIG.statusField === "status") {
      if (payload.status != null) body.set("status", String(payload.status));
    } else {
      if (payload.visibility != null)
        body.set("visibility", String(payload.visibility));
    }

    // แนบไฟล์ภาพ (เลือกคีย์ตาม CONFIG)
    const fileKey = COURSE_API_CONFIG.bannerFileField;
    const file =
      (payload as any).banner_img || (payload as any).banner_image || null;
    if (file) body.set(fileKey, file as File);
  }

  const { data } = await api.put(`/api/courses/${id}/`, body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export function deleteCourse(id: string, config?: { params?: any }) {
  return api.delete(`/api/courses/${id}/`, config); // ✅ ต้องรองรับ config
}

/* =======================
 * Course Approval
 * ======================= */
export async function requestCourseApproval(id: string): Promise<void> {
  await api.post(`/api/courses/${id}/request-approval/`);
}

export async function getCourseApprovalStatus(id: string): Promise<{
  status: "pending" | "approved" | "rejected";
  updated_at?: string;
}> {
  const { data } = await api.get(`/api/courses/${id}/approval-status/`);
  return data;
}

/* =======================
 * Status helpers (ไทย/อังกฤษ) — ใช้ร่วมทุกหน้า
 * ======================= */

// กลุ่มสถานะอนุมัติ (ใช้แสดง badge ใน UI)
export type ApprovalUi = "approved" | "pending" | "rejected";

export const APPROVAL_TH: Record<ApprovalUi, string> = {
  approved: "ผ่านการอนุมัติ",
  pending: "รอดำเนินการ",
  rejected: "ไม่ผ่านการอนุมัติ",
};

// แปลงจาก status ฝั่ง BE -> ค่าที่ FE ใช้
export function courseStatusToApprovalUi(s?: string | null): ApprovalUi {
  const v = (s || "").toUpperCase();
  if (v === "APPROVED") return "approved";
  if (v === "REJECTED") return "rejected";
  if (v === "PENDING" || v === "DRAFT") return "pending";

  // fallback รองรับ BE ส่งมาเป็นตัวเล็ก
  if (s === "approved" || s === "rejected" || s === "pending") {
    return s as ApprovalUi;
  }
  return "pending";
}

export function approvalUiToTh(u: ApprovalUi): string {
  return APPROVAL_TH[u];
}

export function approvalUiColor(u: ApprovalUi): string {
  switch (u) {
    case "approved":
      return "text-green-700 bg-green-100";
    case "rejected":
      return "text-red-700 bg-red-100";
    case "pending":
    default:
      return "text-orange-700 bg-orange-100";
  }
}
/* =======================
 * Status Mapping Utilities
 * ======================= */
export const STATUS_MAPPING = {
  // Thai UI to API
  thaiToApi: {
    เปิด: "OPEN",
    ปิด: "CLOSED",
    ซ่อน: "HIDDEN",
  } as const,
  // API to Thai UI
  apiToThai: {
    OPEN: "เปิด",
    CLOSED: "ปิด",
    HIDDEN: "ซ่อน",
  } as const,
  // Approval status mapping
  approvalStatus: {
    pending: "รอดำเนินการ",
    approved: "ผ่านการอนุมัติ",
    rejected: "ไม่ผ่านการอนุมัติ",
  } as const,
};

export function mapThaiStatusToApi(
  thaiStatus: string
): CourseVisibility | null {
  return (
    STATUS_MAPPING.thaiToApi[
      thaiStatus as keyof typeof STATUS_MAPPING.thaiToApi
    ] || null
  );
}

export function mapApiStatusToThai(apiStatus: string): string {
  return (
    STATUS_MAPPING.apiToThai[
      apiStatus as keyof typeof STATUS_MAPPING.apiToThai
    ] || apiStatus
  );
}

/* =======================
 * Lookups (smart-fallback)
 * ======================= */
export type OptionDTO = { id: string; name: string; slug?: string };

// ไล่ลองหลายเส้นทางเพื่อกัน 404 (เปลี่ยน/เพิ่มได้ตามหลังบ้านจริง)
async function getWithFallback<T>(paths: string[]): Promise<T> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const { data } = await api.get<T>(p);
      return data;
    } catch (e: any) {
      lastErr = e;
      if (e?.response?.status === 401 || e?.response?.status === 403) throw e;
      // อื่น ๆ ลอง path ถัดไป
    }
  }
  throw lastErr ?? new Error(`All paths failed: ${paths.join(", ")}`);
}

export async function listCategories(): Promise<OptionDTO[]> {
  return getWithFallback<OptionDTO[]>([
    "/api/categories/",
    "/api/course-categories/",
    "/api/courses/categories/",
  ]);
}

export async function listCurricula(): Promise<OptionDTO[]> {
  return getWithFallback<OptionDTO[]>([
    "/api/curricula/",
    "/api/curriculums/",
    "/api/courses/curricula/",
  ]);
}

/* =======================
 * Scoring (เกณฑ์การให้คะแนน)
 * ======================= */

export type ScoringItemDTO = {
  id?: string; // POST ไม่ต้องส่ง, PUT จะส่งมาใน response
  description: string;
  correct: number;
  incorrect: number;
  score: number;
  order: number;
};

export type ScoringDTO = {
  id: string | null; // null = ยังไม่เคยตั้งค่า
  course: string; // uuid
  pass_score: number;
  items: ScoringItemDTO[];
};

/** ดึงเกณฑ์ของคอร์ส (ถ้าไม่เคยตั้งค่า จะได้ obj โครงว่างกลับมา) */
export async function getCourseScoring(courseId: string): Promise<ScoringDTO> {
  const { data } = await api.get(`/api/courses/${courseId}/scoring/`);
  return data;
}

/** สร้างครั้งแรก (มีได้ 1 ชุดต่อคอร์ส) */
export async function createCourseScoring(
  courseId: string,
  payload: {
    pass_score: number;
    items: Omit<ScoringItemDTO, "id">[]; // POST ไม่ต้องส่ง id
  }
): Promise<ScoringDTO> {
  const { data } = await api.post(`/api/courses/${courseId}/scoring/`, payload);
  return data;
}

/** อัปเดตแบบแทนที่/ซิงก์รายการทั้งหมด (PUT ต้องส่งทั้งชุด) */
export async function updateCourseScoring(
  courseId: string,
  payload: {
    pass_score: number;
    items: ScoringItemDTO[]; // ส่งทั้งชุดตามลำดับ order
  }
): Promise<ScoringDTO> {
  const { data } = await api.put(`/api/courses/${courseId}/scoring/`, payload);
  return data;
}

/** ลบทั้งชุด (ใช้ระวัง) */
export async function deleteCourseScoring(courseId: string): Promise<void> {
  await api.delete(`/api/courses/${courseId}/scoring/`);
}

export async function upsertCourseScoring(
  courseId: string,
  payload: {
    pass_score: number;
    items: ScoringItemDTO[];
  }
): Promise<ScoringDTO> {
  const current = await getCourseScoring(courseId);
  if (!current.id) {
    // ครั้งแรก -> POST (ไม่ต้องส่ง id ใน items)
    const items = payload.items.map(({ id, ...rest }) => rest);
    return createCourseScoring(courseId, {
      pass_score: payload.pass_score,
      items,
    });
  }
  // มีอยู่แล้ว -> PUT
  return updateCourseScoring(courseId, payload);
}

// ===== Certificates API =====

// --- Certificate DTOs ---
export type CertificateDTO = {
  id: string;
  serial_no: string;
  verification_code: string;
  issued_at: string | null;
  student_name: string;
  course_name: string;
  completion_date: string | null;
  render_status: "pending" | "done" | "failed" | string;
  file_url: string | null;
};

// บันทึกเทมเพลต + (ออปชัน) ออกใบให้ตามตัวเลือก
export async function saveCertificateTemplateAndMaybeIssue(
  courseId: string,
  body: {
    // template fields (optional ทั้งหมด)
    style?: string;
    primary_color?: string;
    secondary_color?: string;
    course_title_override?: string | null;
    issuer_name?: string;
    locale?: string;
    // issue options (optional)
    issue_for_student_ids?: string[];
    issue_for_all_enrolled?: boolean;
    issue_for_completed_only?: boolean;
  }
) {
  const { data } = await api.post<CertificateDTO[]>(
    `/api/courses/${courseId}/certificates/save-and-issue/`,
    body
  );
  return data;
}

// list ใบประกาศของคอร์ส
export async function listCourseCertificates(
  courseId: string
): Promise<CertificateDTO[]> {
  const { data } = await api.get(`/api/courses/${courseId}/certificates/`);
  return data;
}

type SaveAndIssueBody = {
  style?: "classic" | "modern" | "minimalist";
  primary_color?: string;
  secondary_color?: string;
  course_title_override?: string | null;
  issuer_name?: string;
  issue_for_student_ids?: string[]; // เลือกบางคน
  issue_for_all_enrolled?: boolean; // ทั้งคลาส
  issue_for_completed_only?: boolean; // เฉพาะสถานะ completed
};

// helper แปลงไฟล์ให้เป็น URL ใช้งานได้เสมอ
export function toAbsMedia(u?: string | null) {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_BASE.replace(/\/$/, "");
  const path = String(u).replace(/^\//, "");
  return `${base}/${path}`;
}

// ใช้ปุ่มเดียว: บันทึกเทมเพลต + ออกใบประกาศให้เฉพาะผู้ที่จบ/ผ่านเกณฑ์
export async function saveCertificateTemplateAndIssueForCompleted(
  courseId: string,
  tpl: {
    style?: "classic" | "modern" | "minimalist" | string;
    primary_color?: string;
    secondary_color?: string;
    course_title_override?: string | null;
    issuer_name?: string;
    locale?: string;
  }
) {
  const body = {
    ...tpl,
    issue_for_all_enrolled: true,
    issue_for_completed_only: true,
    issue_for_student_ids: [],
  };

  const { data } = await api.post(
    `/api/courses/${courseId}/certificates/save-and-issue/`,
    body,
    { headers: { "Content-Type": "application/json" } } // 👈 บังคับ JSON
  );

  // รองรับทั้ง 2 รูปแบบ response
  // 1) [{...}, {...}]  2) { created: [{...}], ...template_fields }
  const created = Array.isArray(data) ? data : data?.created ?? [];
  return created as CertificateDTO[];
}

/* =======================
 * Courses: University view
 * ======================= */

export async function listUniversityCourses(
  universityId: string,
  params?: {
    status?: CourseStatus;
    q?: string;
  }
): Promise<CourseDTO[]> {
  const res = await api.get<CourseDTO[]>("/api/courses/", {
    params: {
      ...params,
      university: universityId, // query param ที่ BE ใช้ filter
    },
  });
  return res.data;
}

/** ใช้ให้ admin / university อนุมัติ / ไม่อนุมัติคอร์ส */
export async function updateCourseStatus(
  courseId: string,
  status: CourseStatus
): Promise<CourseDTO> {
  const res = await api.patch<CourseDTO>(
    `/api/courses/${courseId}/update-status/`,
    { status }
  );
  return res.data;
}