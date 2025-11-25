"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  X,
  MessageSquareText,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect, RefObject } from "react";
import { getMe, type UserMeDTO, API_BASE } from "@/lib/api";

// --- Function สำหรับจัดการ URL รูปภาพ ---
function getImageUrl(url: string | null | undefined): string {
  if (!url) return "/images/40.png";

  // ถ้าเป็น relative path ให้เติม API_BASE
  if (url.startsWith("/")) {
    return `${API_BASE}${url}`;
  }

  // ถ้าเป็น full URL ให้ใช้เลย
  return url;
}

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

// --- ✨ FIX: ข้อมูลจำลองสำหรับการแจ้งเตือน (ปรับปรุงให้ตรงกับหน้า AllNotifications) ---
const initialNotificationsData = [
  {
    id: 1,
    type: "q&a",
    sender: "สมศรี มีชัย",
    avatar: "/images/40.png",
    time: "10:25 น.",
    relativeTime: "เมื่อ 5 นาทีที่แล้ว",
    lastMessage: "อาจารย์คะ ส่งงานแล้วนะคะ",
    status: "unread",
    href: "/instructor/q&a/chat/1",
  },

  {
    id: 3,
    type: "broadcast",
    sender: "LMS Admin",
    avatar: "/images/40.png",
    time: "เมื่อวาน",
    relativeTime: "1 วันที่แล้ว",
    title: "แจ้งปิดปรับปรุงระบบคืนนี้",
    status: "read",
    href: "/instructor/notifications_instructor/details/3",
  },
];

function NavbarTeacher() {
  // --- State Management ---
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(notiRef, () => setIsNotiOpen(false));
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState(initialNotificationsData);
  const [user, setUser] = useState<UserMeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // --- โหลดข้อมูลผู้ใช้ ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setImageError(false);
        const userData = await getMe();
        if (alive) setUser(userData);
      } catch (error) {
        console.error("Failed to load user data:", error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ ฟังการเปลี่ยนแปลงโปรไฟล์จากหน้า Settings / แท็บอื่น
  useEffect(() => {
    const onMeChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | Partial<UserMeDTO>
        | undefined;
      const fromStorage =
        JSON.parse(localStorage.getItem("me") || "null") || undefined;

      const next = (detail || fromStorage) as UserMeDTO | undefined;
      if (!next) return;
      setImageError(false); // เผื่อมี error เก่าจากรูปเดิม
      setUser((prev) => ({ ...(prev ?? ({} as any)), ...next }));
    };

    // จากหน้าในแอปเดียวกัน
    window.addEventListener("me:changed", onMeChanged);

    // จากอีกแท็บ/วินโดว์
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "me") onMeChanged(new CustomEvent("me:changed"));
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("me:changed", onMeChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // --- ฟังก์ชันจัดการการคลิกแจ้งเตือน ---
  const handleNotificationClick = (id: number) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((noti) =>
        noti.id === id ? { ...noti, status: "read" } : noti
      )
    );
  };

  // --- ฟังก์ชันกรองการแจ้งเตือนตาม Tab ---
  const filteredNotifications = notifications.filter((noti) => {
    if (activeTab === "unread") {
      return noti.status === "unread";
    }
    return true;
  });

  return (
    <nav className=" sticky top-0 z-50 w-full h-[70px] bg-[#414E51] text-white px-6 sm:px-10 py-2 flex items-center justify-between shadow-md">
      {/* ส่วนของโลโก้ */}
      <Link href="/my-courses" passHref>
        <div className="text-white text-[32px] font-bold cursor-pointer">
          LMS
        </div>
      </Link>

      {/* ส่วนโปรไฟล์และแจ้งเตือน */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Dropdown การแจ้งเตือน */}
        <div className="relative" ref={notiRef}>
          <button
            aria-label="Notifications"
            className="hover:text-gray-300 transition-colors duration-200 relative"
            onClick={() => setIsNotiOpen(!isNotiOpen)}
          >
            <Bell className="w-7 h-7 text-white" />
            {notifications.some((n) => n.status === "unread") && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>

          <div
            className={`absolute top-full right-0 mt-4 w-96 bg-white text-gray-800 rounded-lg shadow-xl z-20 overflow-hidden border border-gray-300 transition-all duration-300 ease-in-out ${
              isNotiOpen
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2"
            }`}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">การแจ้งเตือน</h3>
              <Link
                href="/instructor/all_notifications"
                onClick={() => setIsNotiOpen(false)}
                className="text-sm text-blue-600 hover:underline"
              >
                ดูทั้งหมด
              </Link>
            </div>

            {/* Tabs สำหรับกรองการแจ้งเตือน */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setActiveTab("unread")}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === "unread"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                ยังไม่ได้อ่าน
              </button>
            </div>

            {/* ส่วนแสดงรายการแจ้งเตือน */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 ">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((noti) => {
                  const isUnread = noti.status === "unread";
                  return (
                    <Link
                      key={noti.id}
                      href={noti.href}
                      onClick={() => handleNotificationClick(noti.id)}
                      className={`group relative block p-4 border rounded-xl transition-all duration-200 ${
                        isUnread
                          ? "bg-blue-50 border-blue-200 hover:bg-blue-100"
                          : "bg-white border-gray-300 hover:bg-gray-50"
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
                              {noti.type === "q&a" ? (
                                <MessageSquareText
                                  size={16}
                                  className="text-blue-600"
                                />
                              ) : (
                                <Megaphone
                                  size={16}
                                  className="text-orange-600"
                                />
                              )}
                              <p className="font-semibold text-[16px]">
                                {noti.sender}
                                <span className="text-sm text-gray-500 font-normal ml-2">
                                  {noti.time}
                                </span>
                              </p>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {noti.type === "q&a"
                                ? noti.lastMessage
                                : noti.title}
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

        {/* ส่วนแสดงข้อมูลโปรไฟล์ผู้สอน */}
        <button className="flex items-center gap-3 bg-white text-[#414E51] font-semibold pl-2 pr-5 py-1.5 rounded-full hover:bg-gray-200 transition-colors duration-200">
          <div className="w-8 h-8 flex-shrink-0 relative">
            {loading ? (
              <div className="w-full h-full bg-gray-300 rounded-full animate-pulse"></div>
            ) : imageError || !user?.profile_image_url ? (
              <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
            ) : (
              <Image
                key={user?.profile_image_url || "noimg"}
                src={getImageUrl(user.profile_image_url)}
                alt={user?.full_name || "Teacher Avatar"}
                fill
                sizes="32px"
                className="rounded-full object-cover"
                onError={() => {
                  setImageError(true);
                  console.warn("Failed to load profile image:",user.profile_image_url);
                }}
                priority
              />
            )}
          </div>
          <span className="text-[14px] truncate">
            {loading ? "กำลังโหลด..." : user?.full_name || "คุณครู"}
          </span>
        </button>
      </div>
    </nav>
  );
}

export default NavbarTeacher;
