'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

const LogoutConfirmationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- helpers ---
  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access');
  };

  const getRefreshToken = () => {
    if (typeof window === 'undefined') return null;
    const fromStorage = localStorage.getItem('refresh');
    if (fromStorage) return fromStorage;
    // เผื่อคุณเก็บ refresh ในคุกกี้ที่อ่านได้ (ไม่ใช่ HttpOnly)
    const m = document.cookie.match(/(?:^|; )refresh-auth=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  };

  const pickAuthHeader = () => {
  if (typeof window === 'undefined') return {};
  const key =
    localStorage.getItem('key') || sessionStorage.getItem('key');
  const access =
    localStorage.getItem('access') || sessionStorage.getItem('access') ||
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (key)    return { Authorization: `Token ${key}` };    // DRF Token
    if (access) return { Authorization: `Bearer ${access}` }; // JWT
    return {};
  };
  const clientCleanup = () => {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      // [ADD]
      localStorage.removeItem('access_token');
      localStorage.removeItem('key');
      localStorage.removeItem('me');

      sessionStorage.removeItem('access');
      sessionStorage.removeItem('refresh');
      // [ADD]
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('key');

      // broadcast ให้ทุกแท็บหลุดพร้อมกัน
      localStorage.setItem('logout-broadcast', String(Date.now()));
    } catch {}

    // ลบคุกกี้ที่ไม่ใช่ HttpOnly
    document.cookie = 'auth=; Max-Age=0; path=/';
    document.cookie = 'refresh-auth=; Max-Age=0; path=/';
    
    try { delete (api.defaults.headers.common as any).Authorization; } catch {}
  };

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    const access = getAccessToken();
    const refresh = getRefreshToken();

    try {
      // เรียก API logout (รองรับทั้งโหมดคุกกี้/LocalStorage)
      await fetch(`${API_BASE}/api/auth/logout/`, {
        method: 'POST',
        credentials: 'include', // ให้คุกกี้ติดไปด้วยถ้าใช้ HttpOnly
        headers: {
          'Content-Type': 'application/json',
          ...(access ? { Authorization: `Bearer ${access}` } : {}),
          ...pickAuthHeader(), 
        },
        body: JSON.stringify(refresh ? { refresh } : {}),
      });
      toast.success('คุณออกจากระบบเรียบร้อยแล้ว');
    } catch (e) {
      // แม้ error ก็ทำความสะอาดฝั่ง client ต่อ
      toast.error('ออกจากระบบไม่สมบูรณ์ แต่เราเคลียร์ข้อมูลฝั่งเครื่องให้แล้ว');
    } finally {
      clientCleanup();
      setTimeout(() => router.replace('/login'), 600);
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
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <ArrowRightOnRectangleIcon className="h-8 w-8 text-blue-600" strokeWidth={2} />
          </div>

          {/* Confirmation Text */}
          <h2 className="text-xl sm:text-xl font-semibold text-gray-800">
            คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?
          </h2>

          {/* Logout Button */}
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
