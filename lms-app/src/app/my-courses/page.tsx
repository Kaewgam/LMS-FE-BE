"use client";

import React, { useEffect, useMemo, useState, useRef, RefObject } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileX2, Search, Users, Clock } from "lucide-react";
import { FaChevronDown } from "react-icons/fa";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

import {
  API_BASE,
  listMyCourses,
  type CourseDTO,
  type CourseStatus,
  courseStatusToApprovalUi,
  approvalUiToTh,
} from "@/lib/api";

/* =========================
 * Hooks & helpers
 * ========================= */

// ใช้ปิด combobox เมื่อคลิกนอกกล่อง (แบบต้นฉบับ)
function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// ---- helpers: ทำ URL รูปให้ใช้งานได้เสมอ (เวอร์ชันทนทานขึ้น) ----
function normalizeImage(u?: string | null) {
  if (!u) return undefined;
  let s = u.trim();

  // ถอด encode ก่อน (เช่น https%3A/picsum...)
  try {
    s = decodeURIComponent(s);
  } catch {}

  // เคส "/media/https:/picsum..." หรือ "media/http:/xxx"
  const protoIdx =
    s.toLowerCase().indexOf("http:") >= 0
      ? s.toLowerCase().indexOf("http:")
      : s.toLowerCase().indexOf("https:");
  if (protoIdx >= 0) {
    const rest = s.slice(protoIdx); // เช่น "https:/picsum.photos/1200/400?blur=1"
    const isHttps = rest.toLowerCase().startsWith("https:");
    const after = rest.replace(/^https?:/i, "").replace(/^\/+/, "");
    return `${isHttps ? "https" : "http"}://${after}`;
  }

  if (/^https?:\/\//i.test(s)) return s;

  if (!s.startsWith("/")) s = `/${s}`;
  return `${API_BASE}${s}`;
}

function banner(u?: string | null) {
  return normalizeImage(u) ?? "/images/50.png";
}

// บาง backend ใช้ชื่อฟิลด์ไม่เหมือนกัน เราเลยวนหา field ที่เป็นไปได้
type CourseLike = CourseDTO & {
  banner_image_url?: string | null;
  cover_image?: string | null;
  thumbnail?: string | null;
  image?: string | null;
  banner?: string | null;
};
function pickBanner(c: CourseLike) {
  return (
    c.banner_image_url ??
    c.banner_img ??
    c.cover_image ??
    c.thumbnail ??
    c.image ??
    c.banner ??
    null
  );
}

// สีสถานะตัวหนังสือ (ถ้าอยากใช้ต่อ)
function getStatusColor(status: CourseStatus) {
  const ui = courseStatusToApprovalUi(status); // approved | pending | rejected
  switch (ui) {
    case "approved":
      return "text-green-600";
    case "rejected":
      return "text-red-600";
    case "pending":
    default:
      return "text-gray-500";
  }
}

// สไตล์ pill สถานะ (พื้นสี + ตัวอักษร) แบบต้นฉบับ
function getStatusPillClasses(status: CourseStatus) {
  const ui = courseStatusToApprovalUi(status);
  switch (ui) {
    case "approved":
      return "bg-[#E1FBE6] text-[#16A34A]";
    case "rejected":
      return "bg-[#FEE2E2] text-[#DC2626]";
    case "pending":
    default:
      return "bg-gray-100 text-gray-500";
  }
}

// label ของตัวเลือก sort (ใหม่สุด / เก่าสุด)
const sortOptions: Record<"newest" | "oldest", string> = {
  newest: "ใหม่ล่าสุด",
  oldest: "เก่าที่สุด",
};

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // state + ref สำหรับ combobox search / sort (แบบต้นฉบับ)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(searchRef, () => setIsSearchOpen(false));
  useOnClickOutside(sortRef, () => setIsSortOpen(false));

  // โหลดคอร์สจาก API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listMyCourses();
        setCourses(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // toast สร้าง/แก้/ลบ แล้วล้าง query
  useEffect(() => {
    const created = searchParams.get("created");
    const updated = searchParams.get("updated");
    const deleted = searchParams.get("deleted");

    if (created === "1") {
      toast.success("สร้างคอร์สสำเร็จ!", { duration: 2000 });
      router.replace(pathname);
    } else if (updated === "1") {
      toast.success("อัปเดตข้อมูลสำเร็จ!", { duration: 2000 });
      router.replace(pathname);
    } else if (deleted === "1") {
      toast.success("ลบคอร์สสำเร็จแล้ว", { duration: 2000 });
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

  // filter + sort (ข้อมูลเหมือนเวอร์ชัน API, UI แบบเดิม)
  const coursesToDisplay = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = courses.filter((c) =>
      !q
        ? true
        : c.title.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
    );

    const sorted = [...filtered].sort((a, b) => {
      const ta = +new Date(a.updated_at || a.created_at);
      const tb = +new Date(b.updated_at || b.created_at);
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return sorted;
  }, [courses, searchTerm, sortOrder]);

  const goAdd = () => router.push("/add-courses");
  const goEdit = (id: string) => router.push(`/edit-courses?id=${id}`);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <h1 className="text-2xl font-semibold">คอร์สของฉันทั้งหมด</h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          {/* ช่องค้นหาแบบ combobox (เหมือนต้นฉบับ) */}
          <div className="relative w-full sm:w-auto" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="ค้นหาชื่อคอร์ส..."
                className="w-full appearance-none text-base border border-gray-300 rounded-md pl-8 pr-4 py-2 focus:outline-none focus:ring-1 hover:bg-gray-50 focus:ring-gray-300"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
            </div>
            {isSearchOpen && (
              <div className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto bg-white rounded-md shadow-lg z-10">
                {courses
                  .filter((course) =>
                    course.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )
                  .map((course) => (
                    <div
                      key={course.id}
                      onClick={() => {
                        setSearchTerm(course.title);
                        setIsSearchOpen(false);
                      }}
                      className="px-4 py-2 text-base text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {course.title}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ปุ่ม sort แบบ combobox (เหมือนต้นฉบับ) */}
          <div className="relative w-full sm:w-auto" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((o) => !o)}
              className="w-full flex items-center justify-between text-base border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 hover:bg-gray-50 focus:ring-gray-300 cursor-pointer"
            >
              <span>{sortOptions[sortOrder]}</span>
              <FaChevronDown className="text-gray-400" />
            </button>
            {isSortOpen && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                {(Object.keys(sortOptions) as Array<"newest" | "oldest">).map(
                  (value) => (
                    <div
                      key={value}
                      onClick={() => {
                        setSortOrder(value);
                        setIsSortOpen(false);
                      }}
                      className="px-4 py-2 text-base text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      {sortOptions[value]}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <button
            onClick={goAdd}
            className="flex text-base items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <span>เพิ่มคอร์ส</span>
            <span className="text-base font-light">+</span>
          </button>
        </div>
      </header>

      {/* Main (card layout แบบเดิม แต่ใช้ข้อมูลจาก API) */}
      <main>
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
            กำลังโหลดคอร์ส…
          </div>
        ) : coursesToDisplay.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
            <FileX2 size={55} className="mb-5 text-gray-400" />
            <p className="text-base font-semibold text-gray-700">ไม่พบคอร์ส</p>
          </div>
        ) : (
          <div className="space-y-6">
            {coursesToDisplay.map((course) => {
              console.log("course from API", course);
              // Normalize status to lowercase for consistent checking
              const normalizedStatus = (course.status || '').toLowerCase();
              const isPending = normalizedStatus === "pending";
              const isActive = normalizedStatus === "active";
              const isDenied = normalizedStatus === "denied";

              const imgSrc = banner(pickBanner(course as CourseLike));

              // 1) ชั่วโมงเรียน – ใช้ตามชื่อ field จาก API
              const durationHours =
                (course as any).duration_hours ??
                (course as any).duration ??
                (course as any).total_hours ??
                null;

              // 2) จำนวนผู้เรียน
              const studentsCount =
                (course as any).students_count ??
                (course as any).enrollments ??
                (course as any).students ??
                null;

              // Status display mapping
              let statusTh = 'ไม่ทราบสถานะ';
              let statusPill = 'bg-gray-100 text-gray-500';

              if (isPending) {
                statusTh = 'รออนุมัติ';
                statusPill = 'bg-yellow-100 text-yellow-600';
              } else if (isActive) {
                statusTh = 'อนุมัติแล้ว';
                statusPill = 'bg-[#E1FBE6] text-[#16A34A]';
              } else if (isDenied) {
                statusTh = 'ไม่อนุมัติ';
                statusPill = 'bg-[#FEE2E2] text-[#DC2626]';
              }

              return (
                <div
                  key={course.id}
                  onClick={() => !isPending && goEdit(course.id)}
                  className={`flex flex-col lg:flex-row bg-white border border-gray-300 rounded-xl overflow-hidden shadow-lg transition-all ${
                    isPending
                      ? "cursor-not-allowed opacity-70"
                      : "hover:shadow-xl cursor-pointer"
                  }`}
                >
                  {/* รูป (layout ให้เหมือนเดิม) */}
                  <div className="relative w-full lg:w-2/5 flex-shrink-0">
                    {/* กล่องรูป: สัดส่วน 16:9 เท่ากันทุกคอร์ส */}
                    <div className="w-full aspect-[16/9] rounded-l-xl overflow-hidden bg-white">
                      <img
                        src={imgSrc}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "/images/50.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* รายละเอียด (layout + สถานะแบบ pill ต้นฉบับ) */}
                  <div className="w-full lg:w-3/5 p-6 flex flex-col">
                    <div className="mb-2">
                      <div className="flex justify-end">
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-1 text-sm sm:text-base font-semibold ${statusPill}`}
                        >
                          {statusTh}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold mt-1">
                        {course.title}
                      </h2>
                    </div>

                    <p className="text-base mb-4 flex-grow leading-relaxed text-gray-600">
                      {course.description || "-"}
                    </p>

                    <div className="text-base mt-auto">
                      {/* เวลาเรียน */}
                      <div className="flex items-center text-gray-500 mb-2">
                        <Clock size={18} className="mr-2" />
                        <span>
                          {durationHours !== null
                            ? `${durationHours} ชั่วโมง`
                            : "— ชั่วโมง"}
                        </span>
                      </div>
                      {/* จำนวนผู้เรียน */}
                      <div className="flex items-center text-gray-500">
                        <Users size={18} className="mr-2" />
                        <span>
                          {studentsCount !== null ? studentsCount : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toaster ยังอยู่เหมือนไฟล์เชื่อม API */}
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
          success: {
            style: {
              background: "#F0FDF4",
              color: "black",
            },
          },
          error: {
            style: {
              background: "#FFF1F2",
              color: "black",
            },
          },
        }}
      />
    </div>
  );
}
