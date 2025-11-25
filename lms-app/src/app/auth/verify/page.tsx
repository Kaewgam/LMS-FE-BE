'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState('กำลังตรวจสอบลิงก์ยืนยัน...');

  useEffect(() => {
    const uid = sp.get('uid');
    const token = sp.get('token');
    if (!uid || !token) { setMsg('ลิงก์ไม่ถูกต้อง'); return; }

    api.post('/api/auth/verify/', { uid, token })
      .then(() => {
        setMsg('ยืนยันอีเมลเรียบร้อย! ล็อกอินได้แล้ว');
        // ถ้าอยากเด้งไปหน้า login อัตโนมัติ ให้เปิดบรรทัดล่าง
        // setTimeout(() => router.replace('/auth/login'), 1200);
      })
      .catch(e => setMsg(e?.response?.data?.detail || 'ลิงก์หมดอายุ/ไม่ถูกต้อง'));
  }, [sp, router]);

  return <div className="p-8"><h1 className="text-xl font-semibold">{msg}</h1></div>;
}
