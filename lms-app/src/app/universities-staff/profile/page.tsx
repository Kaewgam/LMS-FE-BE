'use client';

import React, { useState, useEffect } from 'react';
// ไอคอนที่ใช้
import { FaGraduationCap } from 'react-icons/fa';
import {
    HiOutlinePresentationChartLine,
    HiOutlineLightBulb,
    HiUsers,
    HiClipboardList,
    HiStar,
    HiRefresh,
} from 'react-icons/hi';
import { RiHandCoinLine } from "react-icons/ri";


const UserProfilePage: React.FC = () => {
    const [currentTime, setCurrentTime] = useState('');
    
    // ข้อมูลจำลองสำหรับแผนภูมิรายปี
    const generateYearlyData = () => {
        const currentBuddhistYear = new Date().getFullYear() + 543;
        const startYear = 2567;
        const data = [];
        for (let year = startYear; year <= currentBuddhistYear; year++) {
            // สร้างข้อมูลตัวอย่างแบบสุ่มเพื่อให้เห็นภาพ
            const baseUsers = 800 + (year - startYear) * 150;
            data.push({
                year: `พ.ศ. ${year}`, // เพิ่ม "พ.ศ." เพื่อความชัดเจน
                users: baseUsers + Math.floor(Math.random() * 100),
                students: Math.floor(baseUsers * 0.9) + Math.floor(Math.random() * 80),
                revenue: (baseUsers * 400) + Math.floor(Math.random() * 50000),
            });
        }
        return data;
    };
    const yearlyStatsData = generateYearlyData();


    const updateCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}`);
    };
    
    useEffect(() => {
        updateCurrentTime();
    }, []);

    const handleRefreshTime = () => {
        updateCurrentTime();
    };

    const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
    
    const getCurrentThaiDate = () => {
        const today = new Date();
        const day = today.getDate();
        const month = thaiMonths[today.getMonth()];
        const year = today.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const getCurrentThaiMonthYear = () => {
        const today = new Date();
        const month = thaiMonths[today.getMonth()];
        const year = today.getFullYear() + 543;
        return `${month} ${year}`;
    };

    const formattedCurrentDate = getCurrentThaiDate();
    const currentMonthAndYear = getCurrentThaiMonthYear();

    // Component สำหรับแผนภูมิแท่ง
    const BarChart = ({ data, dataKey, labelKey, title, unit }: { data: any[], dataKey: string, labelKey: string, title: string, unit: string }) => {
        const maxValue = Math.max(...data.map(item => item[dataKey]));
        const colors = ['bg-sky-400', 'bg-lime-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400'];
        const minBarWidth = 100;
        const scrollThreshold = 5;
        const chartWidth = data.length > scrollThreshold ? `${data.length * minBarWidth}px` : '100%';

        return (
            <div className="text-center">
                <div className="overflow-x-auto w-full pb-4">
                    <div
                        className="h-64 border-b-2 border-l-2 border-gray-200 flex items-end px-2 pt-8"
                        style={{ width: chartWidth }}
                    >
                        {data.map((item, index) => (
                            <div key={item[labelKey]} className="h-full flex flex-col justify-end items-center text-center px-2 relative" style={{ flex: '1 1 0px' }}>
                                <div className="absolute top-0 text-gray-700 text-xs font-bold">
                                    {item[dataKey].toLocaleString()}
                                </div>
                                <div className="w-full h-full flex items-end justify-center group">
                                    <div
                                        style={{ height: `${(item[dataKey] / maxValue) * 90}%` }}
                                        className={`w-full max-w-[80px] rounded-t-md transition-all duration-300 ease-out ${colors[index % colors.length]}`}
                                    >
                                    </div>
                                </div>
                                <p className="text-xs mt-2 text-gray-600 w-full truncate" title={item[labelKey]}>
                                    {item[labelKey]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-gray-700">{title}</p>
                <p className="text-xs text-gray-500">(ตั้งแต่ 2567-ปัจจุบัน)</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-md sm:max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg border border-gray-300 shadow-xl">

                {/* --- ส่วนหัว --- */}
                <div className="border-b border-gray-300 pb-4">
                    <h1 className="text-2xl font-semibold">โปรไฟล์</h1>
                </div>

                {/* --- ข้อมูลทั่วไป --- */}
                <div className="mt-6">
                    <h2 className="font-semibold">ข้อมูลทั่วไป</h2>
                    <div className="flex items-center gap-8 mt-6">
                        <img src="/images/40.png" alt="User Avatar" className="w-30 h-30 rounded-full object-cover"/>
                        <div>
                            <p className="font-semibold mb-6">ศุภ์รไส สุขสวัสดิ์</p>
                            <p className="text-gray-500">Suksai@gmail.com</p>
                        </div>
                    </div>
                </div>

                {/* --- ส่วนภาพรวมข้อมูลสถิติ --- */}
                <div className="mt-8">
                    <h2 className="font-semibold">ภาพรวมข้อมูลของผู้ใช้งานระบบ</h2>
                    <p className="text-sm text-gray-500 mt-1">(อัปเดตเมื่อ {formattedCurrentDate})</p>
                    <div className="space-y-4 mt-6">
                        <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4">
                            <HiUsers className="w-8 h-8 text-gray-500 flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="text-sm">จำนวนผู้ใช้งานทั้งหมด</p>
                                <span className="inline-block mt-1 bg-teal-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                                    1,000 คน
                                </span>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4">
                            <HiOutlinePresentationChartLine className="w-8 h-8 text-gray-500 flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="text-sm">จำนวนหลักสูตรทั้งหมด</p>
                                <span className="inline-block mt-1 bg-teal-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                                    30 หลักสูตร
                                </span>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-center gap-4">
                             <HiClipboardList className="w-8 h-8 text-gray-500 flex-shrink-0" />
                            <div className="flex-grow">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm">จำนวนผู้ใช้งาน ณ เวลานี้</p>
                                    <span className="bg-gray-200 text-gray-600 text-xs font-mono px-2 py-0.5 rounded">
                                        {currentTime}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-block bg-teal-600 text-white text-sm font-bold px-4 py-1 rounded-full">
                                        333 บัญชี
                                    </span>
                                    <HiRefresh 
                                        onClick={handleRefreshTime} 
                                        className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-800 transition-colors" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ส่วนแผนภูมิ --- */}
                <div className='mt-8'>
                    <h2 className="font-semibold">แผนภูมิแสดงความก้าวหน้า</h2>
                    <div className='border border-gray-300 rounded-lg p-6 mt-6 space-y-12'>
                        <BarChart
                            data={yearlyStatsData}
                            dataKey="users"
                            labelKey="year"
                            title="จำนวนผู้ใช้งาน"
                            unit="คน"
                        />
                        <BarChart
                            data={yearlyStatsData}
                            dataKey="students"
                            labelKey="year"
                            title="จำนวนผู้เรียน"
                            unit="คน"
                        />
                        <BarChart
                            data={yearlyStatsData}
                            dataKey="revenue"
                            labelKey="year"
                            title="ยอดขายต่อปี"
                            unit="บาท"
                        />
                    </div>
                </div>
                
                {/* --- ส่วนรายงานล่าสุด --- */}
                <div className="mt-8">
                    <h2 className="font-semibold">รายงานล่าสุด</h2>
                    <p className="text-sm text-gray-500 mt-1">(อัปเดตเดือนปัจจุบัน: {currentMonthAndYear})</p>
                    <div className="border border-gray-300 rounded-lg p-6 mt-6 space-y-4 text-gray-800">
                        <div>
                            <p className="underline font-medium">การอัปโหลดหลักสูตรล่าสุด</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                                <li>หลักสูตรภาษาอังกฤษ</li>
                            </ul>
                        </div>
                        <div>
                            <p className="underline font-medium">การอัปโหลดคอร์สเรียนล่าสุด</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                                <li>คอร์สภาษาอังกฤษเพื่อการสื่อสาร</li>
                            </ul>
                        </div>
                        <div>
                            <p className="underline font-medium">ปรับปรุงเว็บไซต์ล่าสุด</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                                <li>5 มิถุนายน 2568 (21.30 น.)</li>
                            </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserProfilePage;