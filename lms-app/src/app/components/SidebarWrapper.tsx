'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import SidebarTeacher from './SidebarTeacher';
import SidebarAdmin from './SidebarAdmin';
import SidebarSystem from './SidebarSystem';
import SidebarStudent from './SidebarStudent';
import { Bars3Icon } from '@heroicons/react/24/outline'; // นำเข้าไอคอน Bars3

// กำหนดรายการหน้าสำหรับแต่ละ Sidebar
const teacherPaths = ['/instructor/students', '/my-courses', '/instructor/profile', '/instructor/logout','/instructor/support','/instructor/documents_instructor','/instructor/settings_instructor'];
const adminPaths = ['/admin/notification_admin', '/admin/support', '/admin/listorganizations', '/admin/listusers', '/admin/settings_admin', '/admin/documents_admin', '/admin/logout', '/admin/handleinstitutions'];
const systemPaths = ['/universities-staff/documents_universities-staff', '/universities-staff/support', '/universities-staff/logout', '/universities-staff/settings_universities-staff','/universities-staff/profile','/universities-staff/listorganizations'];
const studentPaths = ['/student/settings_student', '/student/documents_student', '/student/logout', '/student/profile','/student/support', '/student/my_courses', '/student/my_favorite_course','/student/review_platform','/student/certificate'];

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hiddenSidebarPaths = ['/permission-denied', '/notfound', '/login'];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (hiddenSidebarPaths.includes(pathname)) {
    return <>{children}</>;
  }

  const showTeacherSidebar = teacherPaths.includes(pathname);
  const showAdminSidebar = adminPaths.includes(pathname);
  const showSystemSidebar = systemPaths.includes(pathname);
  const showStdSidebar = studentPaths.includes(pathname);
  const shouldShowSidebar = showTeacherSidebar || showAdminSidebar || showSystemSidebar || showStdSidebar;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  if (!shouldShowSidebar) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* ส่วน Hamburger Icon สำหรับจอเล็ก */}
      <button
        onClick={toggleMenu}
        className="fixed top-3 left-6 z-51 md:hidden py-3 px-4 rounded-md bg-[#414E51] "
        // เพิ่ม padding, rounded-full, bg-white และ shadow-md
      >
        <Bars3Icon className="h-6 w-6 text-white" />
      </button>

      {/* Sidebar สำหรับจอใหญ่ (แสดงตลอด) */}
      <div className="hidden md:flex flex-shrink-0 bg-white pt-5 w-45">
        {showStdSidebar && <SidebarStudent currentPath={pathname} />}
        {showSystemSidebar && <SidebarSystem currentPath={pathname} />}
        {showAdminSidebar && <SidebarAdmin currentPath={pathname} />}
        {showTeacherSidebar && <SidebarTeacher currentPath={pathname} />}
      </div>

      {/* Sidebar ที่จะแสดงเมื่อกด Hamburger (สำหรับจอเล็ก) */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out md:hidden
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button onClick={toggleMenu} className="p-4 text-xl absolute right-0 top-0">
          &times;
        </button>
        <div className="mt-12 p-4">
          {showStdSidebar && <SidebarStudent currentPath={pathname} />}
          {showSystemSidebar && <SidebarSystem currentPath={pathname} />}
          {showAdminSidebar && <SidebarAdmin currentPath={pathname} />}
          {showTeacherSidebar && <SidebarTeacher currentPath={pathname} />}
        </div>
      </div>

      {/* Overlay เมื่อเมนูเปิด (สำหรับจอเล็ก) */}
      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
        ></div>
      )}

      {/* เส้นแบ่ง (สำหรับจอใหญ่) */}
      <div className="w-[0.5px] flex-shrink-0 bg-[#414E51] ml-20 h-auto hidden md:block" />

      {/* ส่วนเนื้อหาหลัก */}
      <main className="flex-1 p-4 ">{children}</main>
    </div>
  );
}