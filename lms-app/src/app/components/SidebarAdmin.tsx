'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  User,
  ClipboardList,
  FileText,
  List,
  Bell,
  Landmark,
  CircleAlert,
  LogOut,
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

  admin: [
    { label: 'การตั้งค่า', href: '/admin/settings_admin',icon: <User size={18} />  },
    { label: 'รายชื่อผู้ใช้งานทั้งหมด', href: '/admin/listusers',icon: <ClipboardList size={18} /> },
    { label: 'รายชื่อองค์กร', href: '/admin/listorganizations',icon: <List size={18} /> },
    { label: 'การส่งแจ้งเตือน', href: '/admin/notification_admin',icon: <Bell size={18} /> },
    { label: 'จัดการสถาบัน', href: '/admin/handleinstitutions',icon: <Landmark size={18} /> },
    { label: 'เอกสารสำคัญ', href: '/admin/documents_admin',icon: <FileText size={18} /> },
    { label: 'ข้อร้องเรียน', href: '/admin/support',icon: <CircleAlert size={18} />  },
    { label: 'ออกจากระบบ', href: '/admin/logout', icon: <LogOut size={18} /> },
  ]
};

export default function SidebarAdmin({ currentPath }: SidebarProps) {
  const menuItems = sidebarMenus['admin'];

  // ✅ ถ้า currentPath ไม่มีการ match กับเมนูใดเลย ให้ default เป็น '/profile'
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