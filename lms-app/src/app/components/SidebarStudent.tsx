'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  UserRound,
  TvMinimalPlay,
  Heart,
  FileBadgeIcon,
  Settings,
  FileTextIcon,
  CircleAlert,
  LogOutIcon
} from 'lucide-react';

type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  href: string;
  active?: boolean;
};

type SidebarProps = {
  currentPath: string;
};

const sidebarMenus: Record<string, MenuItem[]> = {

  student: [
    { label: 'โปรไฟล์', href: '/student/profile',icon: <UserRound size={18} /> },
    { label: 'คอร์สของฉัน', href: '/student/my_courses' ,icon: <TvMinimalPlay size={18} /> },
    { label: 'คอร์สโปรดของฉัน', href: '/student/my_favorite_course',icon: <Heart size={18} /> },
    { label: 'ใบประกาศณียบัตร', href: '/student/certificate',icon: <FileBadgeIcon size={18} /> },
    { label: 'การตั้งค่า', href: '/student/settings_student', icon: <Settings size={18} /> },
    { label: 'เอกสารสำคัญ', href: '/student/documents_student', icon: <FileTextIcon size={18} /> },
    { label: 'แจ้งปัญหาการใช้งาน', href: '/student/support', icon: <CircleAlert size={18} /> },
    { label: 'รีวิวแพลตฟอร์ม', href: '/student/review_platform', icon: <CircleAlert size={18} /> },
    { label: 'ออกจากระบบ', href: '/student/logout', icon: <LogOutIcon size={18} /> },
  ]
};

export default function SidebarStudent({ currentPath }: SidebarProps) {
  const menuItems = sidebarMenus['student'];

  const activeItem =
    menuItems.find((item) => currentPath.startsWith(item.href)) || menuItems[0];

  return (
    <div className="w-64 h-screen bg-white text-[#414E51] p-5 fixed">
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const isActive = item.href === activeItem.href;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#414E51] text-white font-semibold'
                    : 'hover:bg-[#414E51] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}