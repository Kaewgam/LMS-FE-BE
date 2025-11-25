'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';
import { clearAuth } from '@/lib/auth'; // ✅ ต้องมี

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

const LogoutConfirmationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // เคลียร์ทุกอย่างฝั่ง client
  const clientCleanup = () => {
    try {
      clearAuth(); // ✅ ลบ access, refresh, access_token, refresh_token, key, me (ทั้ง local/session)
      localStorage.setItem('logout-broadcast', String(Date.now())); // แจ้งทุกแท็บ
    } catch {}
    // ลบคุกกี้ที่ไม่ใช่ HttpOnly (ถ้ามี)
    document.cookie = 'auth=; Max-Age=0; path=/';
    document.cookie = 'refresh-auth=; Max-Age=0; path=/';
    // กัน axios จำ Authorization เดิม
    delete (api.defaults.headers.common as any).Authorization;
  };

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // ถ้ามี dj-rest-auth/logout ให้ยิงด้วย (ไม่มีก็จะเข้า catch แล้วเรายังเคลียร์ client ต่อ)
      const key = localStorage.getItem('key') || sessionStorage.getItem('key');
      await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { Authorization: `Token ${key}` } : {}),
        },
        body: JSON.stringify({}),
      });
      toast.success('คุณออกจากระบบเรียบร้อยแล้ว');
    } catch {
      toast.error('ออกจากระบบไม่สมบูรณ์ แต่เราเคลียร์ข้อมูลฝั่งเครื่องให้แล้ว');
    } finally {
      clientCleanup();
      router.replace('/login');
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontSize: '16px',
            padding: '16px 24px',
            fontWeight: '600',
          },
          success: { style: { background: '#F0FDF4', color: 'black' } },
          error: { style: { background: '#FFF1F2', color: 'black' } },
        }}
      />

      <div className="flex items-center justify-center mt-16">
        <div className="bg-white p-8 sm:p-12 rounded-xl border border-gray-300 shadow-lg text-center space-y-6 max-w-md w-full">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <ArrowRightOnRectangleIcon className="h-8 w-8 text-blue-600" strokeWidth={2} />
          </div>

          <h2 className="text-xl sm:text-xl font-semibold text-gray-800">
            คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?
          </h2>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full max-w-xs py-3 px-6 cursor-pointer bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </button>
        </div>
      </div>
    </>
  );
};

export default LogoutConfirmationPage;
