"use client";

import { Bell, Menu, X, Megaphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, RefObject } from "react";

// --- Custom Hook สำหรับตรวจจับการคลิกนอก Component ---
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

// --- (ปรับปรุง) ข้อมูลจำลองสำหรับการแจ้งเตือน (เหลือตัวอย่างเดียว) ---
const initialNotificationsData = [
    {
        id: 1,
        type: 'broadcast',
        sender: "System Maintenance",
        avatar: "/images/40.png",
        time: "14:30 น.",
        relativeTime: "เมื่อ 1 ชั่วโมงที่แล้ว",
        title: "แจ้งอัปเดตเวอร์ชันระบบ LMS",
        status: "unread",
        href: "/universities-staff/notifications_universities-staff/details/1"
    }
];


function NavbarSystem() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(notiRef, () => setIsNotiOpen(false));
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(initialNotificationsData);

  const handleNotificationClick = (id: number) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(noti =>
        noti.id === id ? { ...noti, status: 'read' } : noti
      )
    );
    setIsNotiOpen(false);
  };

  const filteredNotifications = notifications.filter(noti => {
    if (activeTab === 'unread') {
        return noti.status === 'unread';
    }
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full h-[70px] bg-[#414E51] text-white px-6 sm:px-10 py-2 flex items-center justify-between shadow-md">
      <Link href="/universities-staff/management-course" passHref>
        <div className="text-white text-[32px] font-bold cursor-pointer">LMS</div>
      </Link>

      <div className="hidden md:flex items-center gap-4 text-white">
        <Link href="/universities-staff/management-course" className="hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px]">
          จัดการคอร์สเรียน
        </Link>
        <Link href="/universities-staff/management-curriculum" className="hover:text-gray-300 transition-colors duration-200 px-3 py-2 text-[16px]">
          จัดการหลักสูตร
        </Link>

        <div className="flex items-center gap-[25px] ml-4">
          <div className="relative" ref={notiRef}>
            <button
                aria-label="Notifications"
                className="hover:text-gray-300 transition-colors duration-200 relative"
                onClick={() => setIsNotiOpen(!isNotiOpen)}
            >
                <Bell className="w-7 h-7 text-white" />
                {notifications.some(n => n.status === 'unread') && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
            </button>
            <div
                className={`absolute top-full right-0 mt-4 w-96 bg-white text-gray-800 rounded-lg shadow-xl z-20 overflow-hidden border border-gray-300 transition-all duration-300 ease-in-out ${
                    isNotiOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
                }`}
            >
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold text-lg">การแจ้งเตือน</h3>
                    <Link href="/universities-staff/all_notifications" onClick={() => setIsNotiOpen(false)} className="text-sm text-blue-600 hover:underline">
                        ดูทั้งหมด
                    </Link>
                </div>
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-black hover:bg-gray-100'}`}
                    >
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'unread' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-black hover:bg-gray-100'}`}
                    >
                        ยังไม่ได้อ่าน
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 ">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((noti) => {
                            const isUnread = noti.status === 'unread';
                            return (
                            <Link
                                key={noti.id}
                                href={noti.href}
                                onClick={() => handleNotificationClick(noti.id)}
                                className={`group relative block p-4 border rounded-xl transition-all duration-200 ${
                                    isUnread
                                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                    : 'bg-white border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <Image
                                            src={noti.avatar}
                                            alt={noti.sender}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover border border-gray-300"
                                        />
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Megaphone size={16} className="text-orange-600" />
                                                <p className="font-semibold text-[16px]">
                                                    {noti.sender}
                                                    <span className="text-sm text-gray-500 font-normal ml-2">{noti.time}</span>
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1">
                                                {noti.title}
                                            </p>
                                            <div className="flex items-center text-xs text-gray-500 gap-2 mt-2">
                                                <span>{noti.relativeTime}</span>
                                                {isUnread && (
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            );
                        })
                    ) : (
                        <div className="text-center text-gray-500 py-16">
                            <p>ไม่มีการแจ้งเตือน</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
          <button className="flex items-center gap-3 bg-white text-[#414E51] font-semibold pl-2 pr-5 py-1.5 rounded-full hover:bg-gray-200 transition-colors duration-200">
            <Image
              src="/images/40.png"
              alt="Admin Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <span className="text-[14px]">ผู้ดูแลระบบ</span>
          </button>
        </div>
      </div>

      <div className="md:hidden flex items-center gap-4">
        <button aria-label="Notifications" className="hover:text-gray-300 transition-colors duration-200 relative">
          <Bell className="w-6 h-6 text-white" />
           {notifications.some(n => n.status === 'unread') && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#414E51]"></span>
            )}
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          className="text-white focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>
      <div
        className={`md:hidden absolute top-[70px] left-0 w-full bg-[#4A585B] shadow-xl z-10 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4'
        }`}
      >
        <div className="flex flex-col px-5 py-4 space-y-2">
          <Link href="/universities-staff/management-course" className="block py-2 text-[16px] hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>
            จัดการคอร์สเรียน
          </Link>
          <Link href="/universities-staff/management-curriculum" className="block py-2 text-[16px] hover:text-gray-300" onClick={() => setIsMobileMenuOpen(false)}>
            จัดการหลักสูตร
          </Link>
          <div className="border-t border-gray-600 my-2"></div>
          <button className="flex items-center justify-center gap-3 w-full bg-white text-[#414E51] font-semibold px-4 py-2.5 mt-2 rounded-full hover:bg-gray-200 transition-colors duration-200">
             <Image
                src="/images/40.png"
                alt="Admin Avatar"
                width={28}
                height={28}
                className="rounded-full object-cover"
             />
             <span className="text-[14px]">ผู้ดูแลระบบ</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavbarSystem;