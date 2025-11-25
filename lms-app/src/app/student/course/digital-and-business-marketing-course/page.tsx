'use client';
import React, { useState } from 'react';
import { FiClock, FiUsers, FiHeart, FiChevronRight, FiChevronLeft } from 'react-icons/fi';


// สร้างข้อมูลจำลอง
const courseData = {
  imageUrl: '/images/50.png',
  title: 'Data Visualization',
  description: 'สอนการวิเคราะห์ข้อมูลพร้อมใช้ เพื่อช่วยตัดสินใจทางธุรกิจอย่างมีประสิทธิภาพ',
  instructor: 'สมชาย เก่งมาก',
  instructorImageUrl: '/images/40.png',
  duration: '20 ชั่วโมง',
  students: 20,
};

// สร้างข้อมูลจำลอง 30 คอร์ส และเพิ่ม #index เพื่อให้เห็นความแตกต่าง
const allCourses = Array.from({ length: 30 }, (_, i) => ({
  ...courseData,
  title: `Data Visualization #${i + 1}`,
}));


// CourseCard Component 
interface Course {
  imageUrl: string;
  title: string;
  description: string;
  instructor: string;
  instructorImageUrl: string;
  duration: string;
  students: number;
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col transform hover:-translate-y-1 transition-transform duration-300">
      <img src={course.imageUrl} alt={course.title} className="w-full h-40 object-cover" />

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
              <span className="text-sm text-gray-600">{course.instructor}</span>
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
          className="flex mt-3 items-center text-sm text-gray-600 font-medium transition-colors group"
        >
          <span>เพิ่มลงคอร์สโปรดของฉัน</span>
          <FiHeart
            className={`ml-2 transition-all duration-200 ${
              isFavorited
                ? 'text-red-500 fill-current'
                : 'text-gray-400 group-hover:text-red-500'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

// Logic การแบ่งหน้า
const CoursesPage = () => {
  // กำหนดค่าคงที่และ State สำหรับการแบ่งหน้า
  const [currentPage, setCurrentPage] = useState(1);
  const COURSES_PER_PAGE = 12; // 3 แถว * 4 คอลัมน์ = 12

  // คำนวณหาคอร์สที่จะแสดงในหน้าปัจจุบัน 
  const totalPages = Math.ceil(allCourses.length / COURSES_PER_PAGE);
  const indexOfLastCourse = currentPage * COURSES_PER_PAGE;
  const indexOfFirstCourse = indexOfLastCourse - COURSES_PER_PAGE;
  const currentCourses = allCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  // ฟังก์ชันสำหรับเปลี่ยนหน้า 
  const handleNextPage = () => {
    // ไปหน้าถัดไปโดยต้องไม่เกินจำนวนหน้าทั้งหมด
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    // ย้อนกลับไปหน้าก่อนหน้าโดยต้องไม่ต่ำกว่า 1
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-white bg-[#414E51] px-15 py-2 rounded-full">
              Digital & Business Marketing
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/*  แสดงผลคอร์สเฉพาะหน้าปัจจุบัน */}
            {currentCourses.map((course, index) => (
              <CourseCard key={`course-${indexOfFirstCourse + index}`} course={course} />
            ))}
          </div>
        </section>

        {/*  ส่วนของปุ่มควบคุมหน้า  */}
        <div className="mt-12 mb-5 flex justify-between items-center space-x-4">
            <button
                onClick={handlePrevPage}
                disabled={currentPage === 1} // ปิดปุ่มเมื่ออยู่หน้า 1
                className="flex items-center px-1 py-1 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiChevronLeft className="mr-2" />
                ย้อนกลับ
            </button>

            <span className="text-gray-800 font-medium">
                หน้า {currentPage} จาก {totalPages}
            </span>

            <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages} // ปิดปุ่มเมื่ออยู่หน้าสุดท้าย
                className="flex items-center px-1 py-1 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                ถัดไป
                <FiChevronRight className="ml-2" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default CoursesPage;