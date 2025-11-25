"use client";

import React, { useEffect, useState } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

// ใช้ API เดียวกับหน้า Settings
import { getMe, API_BASE } from "@/lib/api";

const UserProfilePage: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // โหลดข้อมูลผู้ใช้ครั้งแรก
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setEmail(me.email || "");
        const name = me.full_name || me.email?.split("@")[0] || "";
        setFullName(name);

        let url = me.profile_image_url || null;
        if (url && !/^https?:\/\//i.test(url)) {
          // ทำให้เป็น absolute url แบบเดียวกับหน้า settings
          url = `${API_BASE}${url}`;
        }
        setProfileImage(url);
      } catch (err) {
        toast.error("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <Toaster position="top-center" />

      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg border border-gray-300 shadow-xl">
        {/* --- ส่วนหัว --- */}
        <div className="border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-semibold">โปรไฟล์</h1>
        </div>

        {/* --- ข้อมูลทั่วไป --- */}
        <div className="mt-6">
          <h2 className="font-semibold">ข้อมูลทั่วไป</h2>

          {isLoading ? (
            <div className="mt-6 animate-pulse">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-56 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-8 mt-6">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="User Avatar"
                  className="w-30 h-30 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                  {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}

              <div>
                <p className="font-semibold mb-2">
                  {fullName || "ไม่พบชื่อผู้ใช้"}
                </p>
                <p className="text-gray-500">{email || "-"}</p>
              </div>
            </div>
          )}
        </div>

        {/* --- สถิติการเรียน --- */}
        <div className="mt-8">
          <h2 className="font-semibold">สถิติการเรียนโดยรวม</h2>
          <p className="text-xs text-gray-400 mt-1">
            * ส่วนนี้จะเชื่อมกับข้อมูลคอร์สเรียนภายหลัง
          </p>

          <div className="space-y-6 mt-6">
            {/* Card 1: ชั่วโมงเรียนสะสม */}
            <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4">
              <ClockIcon className="w-6 h-6 text-gray-500" />
              <div>
                <p className="text-sm">ชั่วโมงเรียนสะสม</p>
                <p className="text-sm font-semibold mt-3">
                  {/* ไว้ค่อยเปลี่ยนเป็นค่าจาก API */}
                  - ชั่วโมง (กำลังพัฒนา)
                </p>
              </div>
            </div>

            {/* Card 2: คอร์สเรียนของฉัน */}
            <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
              <ClockIcon className="w-6 h-6 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-sm">คอร์สเรียนของฉัน</p>
                <ul className="list-disc list-inside mt-3">
                  <li className="text-sm font-semibold text-gray-500">
                    จะดึงจาก API คอร์สเรียนในอนาคต
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3: เรียนจบแล้ว */}
            <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4">
              <ClockIcon className="w-6 h-6 text-gray-500" />
              <div>
                <p className="text-sm">เรียนจบแล้ว</p>
                <p className="text-sm font-semibold mt-3">
                  - คอร์ส (กำลังพัฒนา)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
