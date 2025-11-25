'use client';

import Link from 'next/link';
import {
  UserRound,
  TvMinimalPlay,
  UsersRound,
  Settings,
  FileTextIcon,
  CircleAlert,
  LogOutIcon
} from 'lucide-react';


type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  href: string;
};

type SidebarProps = {
  currentPath: string;
};

const sidebarMenus: Record<string, MenuItem[]> = {
  teacher: [
    { label: 'โปรไฟล์', href: '/instructor/profile', icon: <UserRound size={18} />},
    { label: 'คอร์สของฉัน', href: '/my-courses', icon:<TvMinimalPlay size={18}/> },
    { label: 'นักเรียนของฉัน', href: '/instructor/students', icon:<UsersRound size={18}/>},
    { label: 'การตั้งค่า', href: '/instructor/settings_instructor', icon:<Settings size={18}/> },
    { label: 'เอกสารสำคัญ', href: '/instructor/documents_instructor', icon:<FileTextIcon size={18}/> },
    { label: 'แจ้งปัญหาการใช้งาน', href: '/instructor/support', icon:<CircleAlert size={18}/> },
    { label: 'ออกจากระบบ', href: '/instructor/logout', icon:<LogOutIcon size={18}/> },
  ],
};

export default function SidebarTeacher({ currentPath }: SidebarProps) {
  const menuItems = sidebarMenus['teacher'];

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
