"use client";

// 👇 1. นำเข้า hooks ที่จำเป็นและ icon
import { useState, useRef, useEffect, RefObject } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// 👇 2. เพิ่ม Custom Hook สำหรับตรวจจับการคลิกนอกพื้นที่ (เหมือนเดิม)
function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
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

// 👇 3. เพิ่มข้อมูลสำหรับแสดงใน Dropdown
const recommendedCourses = [
    { name: "Data", href: "/student/course/data-course" },
    { name: "Design", href: "/student/course/design-course" },
    { name: "Digital & Business Marketing", href: "/student/course/digital-and-business-marketing-course" },
];


const Navbar: React.FC = () => {
  // 👇 4. เพิ่ม state และ ref สำหรับควบคุม Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  return (
    <nav className="w-full bg-white shadow-sm top-0 z-50 sticky ">
      <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center">
        {/* // Logo -- Wrapped with Link */}
        <Link href="/home" className="flex items-center gap-2">
          <Image
            src="/images/LMS.png"
            alt="LMS Logo"
            width={60}
            height={60}
          />
        </Link>

        {/* // Gang */}
        <div className="hidden md:flex gap-4 text-lg font-medium text-[#2D2D2D] flex-1 justify-end items-center">

          {/* ====== 👇 ส่วนของ Dropdown ที่นำมาใส่แทน Link เดิม ====== */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex cursor-pointer items-center gap-2 hover:text-gray-500  transition-colors duration-200 px-3 py-2 text-[16px] rounded-md focus:outline-none ${isDropdownOpen ? 'bg-gray-100 text-gray-500' : ''}`}
            >
              หมวดหมู่คอร์ส
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
              className={`absolute cursor-pointer top-full left-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-xl z-20 overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out ${
                isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
              }`}
            >
              {recommendedCourses.map((course) => (
                <Link
                  key={course.name}
                  href={course.href}
                  className="block px-5 py-3 hover:bg-gray-100 text-[16px] transition-colors duration-200"
                  onClick={() => setIsDropdownOpen(false)} // คลิกแล้วให้ปิดเมนู
                >
                  {course.name}
                </Link>
              ))}
            </div>
          </div>
          {/* ========================================================== */}

          <Link href="/student/course" className="hover:text-gray-500 transition px-3 py-2 text-[16px]">
            คอร์สแนะนำ
          </Link>
          <Link href="/in-house-training" className="hover:text-gray-500 transition px-3 py-2 text-[16px]">
            In House Training
          </Link>
          {/* <Link href="/bootcamp" className="hover:text-gray-500 transition px-3 py-2 text-[16px]">
            Bootcamps
          </Link> */}

          {/* // Left */}
          <div className="flex items-center gap-4 ml-4"> {/* เพิ่ม ml-4 เพื่อระยะห่าง */}
            <Link href="/login" className="hover:text-gray-500 transition px-3 py-2 text-[16px]">
              เข้าสู่ระบบ
            </Link>

            {/* // Line */}
            <span className="h-5 border-l border-gray-400"></span>
            <Link href="/register" className="hover:text-gray-500 transition px-3 py-2 text-[16px]">
              ลงทะเบียน
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;