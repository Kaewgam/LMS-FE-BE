'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- Interface และข้อมูลจำลองสำหรับใบประกาศ ---
// สร้าง Interface ใหม่สำหรับข้อมูลใบประกาศแต่ละใบ
interface Certificate {
    id: number;
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    primaryColor: string;
    secondaryColor: string;
}

// ข้อมูลจำลอง 2 ใบ ตามที่คุณต้องการ
const initialCertificates: Certificate[] = [
    {
        id: 1,
        studentName: 'สมชาย ใจดี',
        courseName: 'Data Visualization',
        instructorName: 'กิ่งฟ้า คล้ายสวน',
        completionDate: '15 มิถุนายน 2568',
        primaryColor: '#1e40af', // Blue
        secondaryColor: '#334155',
    },
    {
        id: 2,
        studentName: 'สมชาย ใจดี',
        courseName: 'Advanced Python Programming',
        instructorName: 'วิชัย เก่งกาจ',
        completionDate: '28 สิงหาคม 2568',
        primaryColor: '#047857', // Green
        secondaryColor: '#334155',
    },
];


// --- Component สำหรับแสดงผลใบประกาศ (จากโค้ดที่คุณให้มา) ---
// ไม่มีการแก้ไขในส่วนนี้
const CertificateDisplay: React.FC<Omit<Certificate, 'id'>> = ({ studentName, courseName, instructorName, completionDate, primaryColor, secondaryColor }) => {
    const text = {
        title: "ใบประกาศนียบัตร",
        presentedTo: "มอบให้ไว้เพื่อแสดงว่า",
        completionMessage: "ได้สำเร็จการศึกษาตามหลักสูตร",
        instructor: "ผู้สอน",
        completionDate: "วันที่สำเร็จการศึกษา",
    };
    return (
        <div className="w-full aspect-[1.414] shadow-lg flex flex-col justify-between items-center transition-all duration-300 p-10" style={{ border: `12px double ${primaryColor}`, backgroundColor: '#ffffffff' }}>
            <div className="text-center">
                <p className="text-2xl font-semibold tracking-widest" style={{ color: secondaryColor }}>{text.title}</p>
                <div className="my-4 w-60 h-1 mx-auto" style={{ backgroundColor: primaryColor }}></div>
                <p className="text-md mt-6" style={{ color: secondaryColor }}>{text.presentedTo}</p>
                <h1 className="text-4xl font-semibold my-6" style={{ color: primaryColor }}>{studentName}</h1>
                <p className="text-md" style={{ color: secondaryColor }}>{text.completionMessage}</p>
                <h2 className="text-2xl font-semibold mt-4" style={{ color: primaryColor }}>{courseName}</h2>
            </div>
            <div className="w-full flex justify-between items-end mt-8" style={{ color: secondaryColor }}>
                <div className="text-center"> <p className="font-semibold text-lg pb-2 border-b-2 " style={{ borderColor: primaryColor }}>{instructorName}</p> <p className="text-sm mt-2">{text.instructor}</p> </div>
                <div className="text-center"> <p className="font-semibold text-lg pb-2 border-b-2" style={{ borderColor: primaryColor }}>{completionDate}</p> <p className="text-sm mt-2">{text.completionDate}</p> </div>
            </div>
        </div>
    );
};


// --- Component "การ์ด" สำหรับหุ้มใบประกาศแต่ละใบ ---
// (ทำหน้าที่คล้าย CourseCard ในตัวอย่างก่อนหน้า)
interface CertificateCardProps {
    certificate: Certificate;
}

const CertificateCard: React.FC<CertificateCardProps> = ({ certificate }) => {
    const router = useRouter();

    // เมื่อคลิกที่การ์ด จะนำทางไปยังหน้าที่กำหนด
    const handleCardClick = () => {
        router.push('/student/course-details/quiz/certificate');
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-white rounded-xl p-4 shadow-lg overflow-hidden border border-gray-200 cursor-pointer group transition-all duration-200 hover:shadow-xl hover:border-gray-300"
        >
            <CertificateDisplay {...certificate} />
        </div>
    );
};


// --- Component หลักของหน้า "ใบประกาศนียบัตรของฉัน" ---
// (ใช้แพตเทิร์นเดียวกับ MyCoursesPage)
const MyCertificatesPage: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);

    return (
        <div className="min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl text-black font-semibold">ใบประกาศนียบัตรของฉัน</h1>
                <hr className="mt-[-10px] mb-8 border-t-2 border-gray-200" />
                
                <div className="space-y-8">
                    {certificates.length > 0 ? (
                        certificates.map(cert => (
                            <CertificateCard
                                key={cert.id}
                                certificate={cert}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 mt-8">คุณยังไม่มีใบประกาศนียบัตร</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCertificatesPage;