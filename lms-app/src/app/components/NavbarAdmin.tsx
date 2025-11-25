"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link"; // 👈 เพิ่มการนำเข้า Link component

const AdminNavbar: React.FC = () => {
  return (
    <nav className="w-full h-[70px] bg-[#414E51] flex items-center justify-between px-6 sm:px-10 sticky top-0 z-50">
      {/* LMS Logo */}
      <Link href="/admin/settings_admin" passHref><div className="text-white text-2xl sm:text-[32px] font-bold">LMS</div></Link>

      {/* 👇 ส่วนโปรไฟล์ที่สามารถคลิกได้ */}
      <Link href="/admin/settings_admin" passHref>
        <button className="flex items-center cursor-pointer gap-3 bg-white text-[#414E51] font-semibold pl-2 pr-5 py-1.5 rounded-full hover:bg-gray-200 transition-colors duration-200">
          <Image
            src="/images/40.png"
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
          <span className="text-[14px]">หมูปิ้ง ไก่ทอด</span>
        </button>
      </Link>
    </nav>
  );
};

export default AdminNavbar;