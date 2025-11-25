"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// --- (✨ ปรับปรุง) Mock Data: สำหรับมุมมอง 'ผู้ดูแลสถาบัน' ---
// อ้างอิงข้อมูลจากการแจ้งเตือน ID 1 ที่เคยใช้ในหน้า AllNotificationsPageAdmin
const notificationDetails = {
    '1': { 
        sender: 'System Maintenance',
        avatar: '/images/40.png',
        role: 'ระบบแจ้งเตือนอัตโนมัติ',
        title: 'แจ้งอัปเดตเวอร์ชันระบบ LMS',
        message: 'เรียน ผู้ดูแลระบบ, ระบบ LMS จะมีการอัปเดตเวอร์ชันเพื่อเพิ่มประสิทธิภาพและแก้ไขข้อบกพร่องเล็กน้อยในคืนนี้ เวลา 02:00 น. ถึง 03:00 น. ขออภัยในความไม่สะดวก'
    }
};

// --- (✨ ปรับปรุง) เปลี่ยนชื่อ Component ---
export default function NotificationDetailPageAdmin() {
    const params = useParams();
    const notificationId = params.id as string;

    // Logic การดึงข้อมูลยังคงเดิม
    const detail = notificationDetails[notificationId as keyof typeof notificationDetails];

    // กรณีไม่พบข้อมูล
    if (!detail) {
        return (
            <main className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">ไม่พบการแจ้งเตือน</h1>
                    {/* (✨ ปรับปรุง) แก้ Link ให้กลับไปหน้าของผู้ดูแล */}
                    <Link href="/universities-staff/all_notifications" className="text-blue-600 hover:underline mt-4 inline-block">
                        กลับไปหน้ารวมการแจ้งเตือน
                    </Link>
                </div>
            </main>
        );
    }

    // กรณีพบข้อมูล
    return (
        <main className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto bg-white border border-gray-300 shadow-lg rounded-2xl flex flex-col overflow-hidden">
                <header className="relative flex flex-col items-center p-6 space-y-3">
                    {/* (✨ ปรับปรุง) แก้ Link ให้กลับไปหน้าของผู้ดูแล */}
                    <Link href="/universities-staff/all_notifications" className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
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