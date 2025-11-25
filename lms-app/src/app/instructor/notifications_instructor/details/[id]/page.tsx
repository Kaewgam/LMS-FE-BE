"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// --- ✨ Mock Data: แก้เป็นมุมมองของ 'ผู้สอน' ---
const notificationDetails = {
    '1': { // ID การแจ้งเตือนจากนักเรียน สมศรี
        sender: 'สมศรี มีชัย',
        avatar: '/images/40.png',
        role: 'ผู้เรียน : Full-Stack Web Development',
        title: 'ส่งการบ้านแล้วค่ะ',
        message: 'อาจารย์คะ หนูส่งการบ้านบทที่ 3 เรียบร้อยแล้วค่ะ รบกวนอาจารย์ช่วยตรวจสอบด้วยนะคะ ขอบคุณค่ะ'
    },
    '3': { // ID ของ LMS (อันนี้เหมือนเดิม เพราะเป็นประกาศจากระบบ)
        sender: 'LMS Admin',
        avatar: '/images/40.png',
        role: 'ระบบแจ้งเตือนอัตโนมัติ',
        title: 'แจ้งปิดปรับปรุงระบบคืนนี้',
        message: 'ระบบจะมีการปิดปรับปรุงในวันเสาร์ที่ 14 กันยายน 2568 เวลา 02:00 น. ถึง 03:00 น. เพื่อเพิ่มประสิทธิภาพการทำงาน'
    }
};

export default function NotificationDetailPageTeacher() { // <-- เปลี่ยนชื่อ Component
    const params = useParams();
    const notificationId = params.id as string;

    const detail = notificationDetails[notificationId as keyof typeof notificationDetails];

    if (!detail) {
        return (
            <main className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">ไม่พบการแจ้งเตือน</h1>
                    {/* ✨ FIX: แก้ Link ให้กลับไปหน้าของผู้สอน */}
                    <Link href="/instructor/all_notifications" className="text-blue-600 hover:underline mt-4 inline-block">
                        กลับไปหน้ารวมการแจ้งเตือน
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-lg rounded-2xl flex flex-col overflow-hidden">
                <header className="relative flex flex-col items-center p-6 space-y-3">
                    {/* ✨ FIX: แก้ Link ให้กลับไปหน้าของผู้สอน */}
                    <Link href="/instructor/all_notifications" className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft size={24} className="" />
                    </Link>
                    <Image
                        src={detail.avatar}
                        alt={detail.sender}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-gray-300"
                    />
                    <div>
                        <h1 className="text-2xl font-semibold text-center">{detail.sender}</h1>
                        <p className="text-sm text-gray-600 text-center">({detail.role})</p>
                    </div>
                </header>

                <hr className="border-gray-300" />

                <section className="p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-center mb-6">{detail.title}</h2>
                    <div className="bg-gray-100 p-6 rounded-xl border border-gray-300">
                        <p className=" leading-relaxed text-center">{detail.message}</p>
                    </div>
                </section>
            </div>
        </main>
    );
}