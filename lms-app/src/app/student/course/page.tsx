"use client";

import React, { useEffect, useState } from "react";
import { FiClock, FiUsers, FiHeart, FiChevronRight } from "react-icons/fi";
import Link from "next/link";

import { API_BASE, listCourses, type CourseDTO } from "@/lib/api";

/* =========================
 * Helpers
 * ========================= */
const toAbs = (u?: string | null): string | null => {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_BASE.replace(/\/$/, "");
  const path = String(u).replace(/^\//, "");
  return `${base}/${path}`;
};

/* =========================
 * UI Types
 * ========================= */
interface CourseCardUI {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  instructor: string;
  instructorImageUrl: string;
  duration: string;
  students: number;
  category: string | null;
}

/* map จาก DTO -> UI */
function mapCourseDtoToUi(c: CourseDTO): CourseCardUI {
  return {
    id: c.id,
    imageUrl: toAbs(c.banner_img) || "/images/50.png",
    title: c.title,
    description: c.description || "ยังไม่มีคำอธิบายคอร์ส",
    instructor: c.instructor_name || "ผู้สอน",
    // ตอนนี้หลังบ้านยังไม่ได้ส่งรูป instructor แยกมา ใช้รูป default ไปก่อน
    instructorImageUrl: "/images/40.png",
    duration: c.duration_hours ? `${c.duration_hours} ชั่วโมง` : "ไม่ระบุเวลาเรียน",
    // ยังไม่มี field count ผู้เรียนใน CourseSerializer ใช้ 0 ไว้ก่อน
    students: 0,
    category: c.category_name || null,
  };
}

/* =========================
 * Course Card Component
 * ========================= */
const CourseCard: React.FC<{ course: CourseCardUI }> = ({ course }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFavorited((prev) => !prev);
  };

  const href = `/student/course-details?courseId=${course.id}`;

  return (
    <Link href={href} className="h-full">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300 h-full">
        <img
          src={course.imageUrl}
          alt={course.title}
          className="w-full h-40 object-cover"
        />
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-md font-bold text-gray-900 truncate">
            {course.title}
          </h3>
          <p className="text-sm text-gray-500 mt-2 flex-grow">
            {course.description}
          </p>
          <div className="mt-3">
            <div className="flex items-center">
              <img
                src={course.instructorImageUrl}
                alt={course.instructor}
                className="w-8 h-8 rounded-full mr-2 object-cover border border-gray-200"
              />
              <span className="text-sm text-gray-600">
                {course.instructor}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center">
                <FiClock className="mr-1.5" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center">
                <FiUsers className="mr-1.5" />
                <span>{course.students} คน</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 flex justify-end">
          <button
            onClick={handleFavoriteClick}
            className="flex mt-3 items-center text-sm text-gray-600 font-medium transition-colors group z-10 relative"
          >
            <span>เพิ่มลงคอร์สโปรดของฉัน</span>
            <FiHeart
              className={`ml-2 transition-all duration-200 ${
                isFavorited
                  ? "text-red-500 fill-current"
                  : "text-gray-400 group-hover:text-red-500"
              }`}
            />
          </button>
        </div>
      </div>
    </Link>
  );
};

/* =========================
 * Main Page
 * ========================= */
const CoursesPage: React.FC = () => {
  const [allCourses, setAllCourses] = useState<CourseCardUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ดึงคอร์สทั้งหมดจากหลังบ้าน (ให้ backend กรองเองตาม default)
      const rawCourses = await listCourses();
      const uiCourses = rawCourses.map(mapCourseDtoToUi);
      setAllCourses(uiCourses);
    } catch (err) {
      console.error("load courses error", err);
      setError("โหลดรายวิชาล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  load();
}, []);

  // แบ่งตามหมวดหมู่จาก category_name (ถ้าไม่ตรงชื่อจริงในฐาน ก็ยังเห็นใน "ทั้งหมด" อยู่ดี)
  const popularCourses = allCourses;

  const dataCourses = allCourses.filter(
    (c) => (c.category || "").toLowerCase() === "data"
  );
  const designCourses = allCourses.filter(
    (c) => (c.category || "").toLowerCase() === "design"
  );
  const marketingCourses = allCourses.filter((c) =>
    (c.category || "").toLowerCase().includes("marketing")
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {isLoading && (
          <p className="text-gray-500 mb-4">กำลังโหลดรายวิชา...</p>
        )}
        {error && (
          <p className="text-red-500 mb-4 text-sm">
            {error}
          </p>
        )}

        {/* --- Section: ทั้งหมด --- */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-white bg-[#414E51] px-15 py-2 rounded-full">
              ทั้งหมด
            </h2>
            <Link
              href="/student/course/all-course"
              className="text-sm font-semibold hover:underline flex items-center"
            >
              <span>ดูเพิ่มเติม</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          {popularCourses.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500">
              ยังไม่มีคอร์สที่เปิดสอน
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {popularCourses.map((course) => (
                <CourseCard key={`popular-${course.id}`} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* --- Section: Data --- */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-white bg-[#414E51] px-15 py-2 rounded-full">
              Data
            </h2>
            <Link
              href="/student/course/data-course"
              className="text-sm font-semibold hover:underline flex items-center"
            >
              <span>ดูเพิ่มเติม</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          {dataCourses.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500">
              ยังไม่มีคอร์สหมวด Data
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dataCourses.map((course) => (
                <CourseCard key={`data-${course.id}`} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* --- Section: Design --- */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-white bg-[#414E51] px-15 py-2 rounded-full">
              Design
            </h2>
            <Link
              href="/student/course/design-course"
              className="text-sm font-semibold hover:underline flex items-center"
            >
              <span>ดูเพิ่มเติม</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          {designCourses.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500">
              ยังไม่มีคอร์สหมวด Design
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designCourses.map((course) => (
                <CourseCard key={`design-${course.id}`} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* --- Section: Digital & Business Marketing --- */}
        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-white bg-[#414E51] px-15 py-2 rounded-full">
              Digital &amp; Business Marketing
            </h2>
            <Link
              href="/student/course/digital-and-business-marketing-course"
              className="text-sm font-semibold hover:underline flex items-center"
            >
              <span>ดูเพิ่มเติม</span>
              <FiChevronRight className="ml-1" />
            </Link>
          </div>
          {marketingCourses.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500">
              ยังไม่มีคอร์สหมวด Digital &amp; Business Marketing
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {marketingCourses.map((course) => (
                <CourseCard
                  key={`marketing-${course.id}`}
                  course={course}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CoursesPage;
