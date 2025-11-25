"use client";

import { Bell, ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // 👈 1. นำเข้า Image component
import { useState, useRef, useEffect, RefObject } from "react";

// --- Custom Hook to detect click outside (คงเดิม) ---
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

// --- Recommended Courses Data (คงเดิม) ---
const recommendedCourses = [
  { name: "Data", href: "/student/course/data-course" },
  { name: "Design", href: "/student/course/design-course" },
  { name: "Digital & Business Marketing", href: "/student/course/digital-and-business-marketing-course" },
];

function NavbarStd() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSubMenuOpen, setIsMobileSubMenuOpen] = useState(false);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSubMenuOpen(false);
  };

  return (
    <nav className="relative w-full h-[70px] bg-[#414E51] text-white px-6 sm:px-10 py-2 flex items-center justify-between shadow-md">
      {/* Logo */}
      <Link href="/home" passHref onClick={closeAllMenus}>
        <div className="text-white text-[32px] font-bold cursor-pointer">LMS</div>
      </Link>

      {/* ====== เมนูสำหรับ Desktop ====== */}
      <div className="hidden md:flex gap-4 text-lg font-medium text-white flex-1 justify-end items-center">
        

        {/* Recommended Courses Dropdown (สำหรับ Desktop) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px] rounded-md focus:outline-none ${isDropdownOpen ? 'bg-[#5A686B]' : ''}`}
          >
            หมวดหมู่คอร์ส
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <div
            className={`absolute top-full left-0 mt-2 w-64 bg-[#4A585B] text-white rounded-lg shadow-xl z-20 overflow-hidden border border-gray-600 transition-all duration-300 ease-in-out ${
              isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
            }`}
          >
            {recommendedCourses.map((course) => (
              <Link
                key={course.name}
                href={course.href}
                className="block px-5 py-3 hover:bg-[#5A686B] text-[16px] transition-colors duration-200"
                onClick={() => setIsDropdownOpen(false)}
              >
                {course.name}
              </Link>
            ))}
          </div>
        </div>

        <Link href="/student/course" className="hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px]">
          คอร์สแนะนำ
        </Link>

        <Link href="/in-house-training" className="hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px]">
          In House Training
        </Link>
        <Link href="/bootcamp" className="hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px]">
          Bootcamps
        </Link>

        {/* 👇 2. ส่วนโปรไฟล์สำหรับ Desktop (ปรับปรุงใหม่) */}
        <div className="flex items-center gap-[25px] ml-4">
          <button aria-label="Notifications" className="hover:text-gray-300 transition-colors duration-200">
            <Bell className="w-7 h-7 text-white" />
          </button>
          <button className="flex items-center gap-3 bg-white text-[#414E51] font-semibold pl-2 pr-5 py-1.5 rounded-full hover:bg-gray-200 transition-colors duration-200">
            <Image
              src="/images/40.png" // 👈 แก้ path รูปภาพตรงนี้
              alt="User Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <span className="text-[14px]">หมูปิ้ง ไก่ทอด</span>
          </button>
        </div>
      </div>

      {/* ====== ปุ่มสำหรับเมนูมือถือ ====== */}
      <div className="md:hidden flex items-center gap-4">
        <button aria-label="Notifications" className="hover:text-gray-300 transition-colors duration-200">
          <Bell className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          className="text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* ====== แผงเมนูสำหรับมือถือ ====== */}
      <div
        className={`md:hidden absolute top-[70px] left-0 w-full bg-[#4A585B] shadow-xl z-10 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'
        }`}
      >
        <div className="flex flex-col px-5 py-4 space-y-2">
          <Link href="/student/course" className="block py-2 text-[16px] hover:text-gray-300" onClick={closeAllMenus}>
            หมวดหมู่คอร์ส
          </Link>
          {/* Accordion สำหรับ Mobile */}
          <div>
            <button
              onClick={() => setIsMobileSubMenuOpen(!isMobileSubMenuOpen)}
              className="w-full flex justify-between items-center py-2 text-[16px] hover:text-gray-300"
            >
              <span>คอร์สแนะนำ</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMobileSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMobileSubMenuOpen && (
              <div className="pl-4 border-l-2 border-gray-500 mt-2 space-y-1">
                {recommendedCourses.map((course) => (
                  <Link
                    key={course.name}
                    href={course.href}
                    className="block py-2 text-[15px] hover:text-gray-300"
                    onClick={closeAllMenus}
                  >
                    {course.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          

          <div className="border-t border-gray-600 my-2"></div>

          {/* 👇 3. ส่วนโปรไฟล์สำหรับมือถือ (ปรับปรุงใหม่) */}
          <button className="flex items-center justify-center gap-3 w-full bg-white text-[#414E51] font-semibold px-4 py-2.5 mt-2 rounded-full hover:bg-gray-200 transition-colors duration-200">
             <Image
                src="/images/40.png" // 👈 แก้ path รูปภาพตรงนี้
                alt="User Avatar"
                width={28}
                height={28}
                className="rounded-full object-cover"
             />
             <span className="text-[14px]">หมูปิ้ง ไก่ทอด</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavbarStd;