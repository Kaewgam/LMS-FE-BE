'use client';

import React from 'react';
// ไอคอนที่ใช้
import { FaGraduationCap } from 'react-icons/fa';
import {
    HiOutlinePresentationChartLine,
    HiOutlineLightBulb,
    HiUsers,
    HiClipboardList,
    HiStar,
} from 'react-icons/hi';
import { RiHandCoinLine } from "react-icons/ri";


// --- ข้อมูลจำลองสำหรับแสดงผล ---
const educationHistory = [
    { id: 'edu2', level: 'ปริญญาโท', university: 'สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง', startYear: '2022', endYear: '2024' },
    { id: 'edu1', level: 'ปริญญาตรี', university: 'University of California, Los Angeles', startYear: '2018', endYear: '2022' },
];

const teachingExperience = [
    { id: 'teach1', topic: 'ภาษาอังกฤษเพื่อการสื่อสาร', description: 'อาจารย์สอนวิชาภาษาอังกฤษเพื่อการสื่อสารของมหาวิทยาลัยเชาว์ปัญญา', startYear: '2023', endYear: 'ปัจจุบัน' },
];

const motto = '‘ตอนบนกับขบไก่ใช้เวลาเท่ากัน แต่ตอนขบไก่ได้เนื้อไก่เยอะกว่า’';

// --- ข้อมูลจำลองสำหรับส่วนสถิติ (8 คอร์ส) ---
const statsData = {
    courses: [
        { id: 1, name: "คอร์สภาษาอังกฤษเพื่อการเขียน", students: 100, completionRate: 80, averageScore: 65, maxScore: 100, revenue: 50000 },
        { id: 2, name: "คอร์ส Data Science 101", students: 75, completionRate: 65, averageScore: 72, maxScore: 100, revenue: 45000 },
        { id: 3, name: "คอร์ส UX/UI Design", students: 120, completionRate: 90, averageScore: 85, maxScore: 100, revenue: 75000 },
        { id: 4, name: "การตลาดดิจิทัลเบื้องต้น", students: 95, completionRate: 70, averageScore: 78, maxScore: 100, revenue: 60000 },
        { id: 5, name: "การเขียนโปรแกรม Python", students: 150, completionRate: 85, averageScore: 88, maxScore: 100, revenue: 90000 },
        { id: 6, name: "React for Beginners", students: 80, completionRate: 75, averageScore: 82, maxScore: 100, revenue: 55000 },
        { id: 7, name: "การจัดการโปรเจกต์แบบ Agile", students: 60, completionRate: 95, averageScore: 90, maxScore: 100, revenue: 40000 },
        { id: 8, name: "พื้นฐานการถ่ายภาพ", students: 110, completionRate: 80, averageScore: 81, maxScore: 100, revenue: 52000 },
    ],
    get totalRevenue() {
        return this.courses.reduce((sum, course) => sum + course.revenue, 0);
    },
    get topPopularCourses() {
        return [...this.courses]
            .sort((a, b) => b.students - a.students)
            .slice(0, 3);
    }
};


const UserProfilePage: React.FC = () => {
    // --- ฟังก์ชันสร้างวันที่ปัจจุบันเป็นภาษาไทย ---
    const getCurrentThaiDate = () => {
        const today = new Date();
        const thaiMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
        const day = today.getDate();
        const month = thaiMonths[today.getMonth()];
        const year = today.getFullYear() + 543;
        return `${day} ${month} ${year}`;
    };

    const formattedCurrentDate = getCurrentThaiDate();

    // --- Component สำหรับแผนภูมิแท่ง ---
    const BarChart = ({ data, dataKey, title, unit }: { data: any[], dataKey: 'students' | 'revenue', title: string, unit: string }) => {
        const maxValue = Math.max(...data.map(item => item[dataKey]));
        const colors = ['bg-sky-400', 'bg-lime-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400'];

        const minBarWidth = 100;
        const scrollThreshold = 5;

        const chartWidth = data.length > scrollThreshold 
            ? `${data.length * minBarWidth}px` 
            : '100%';

        return (
            <div className="text-center">
                <div className="overflow-x-auto w-full pb-4">
                    <div 
                        className="h-64  border-b-2 border-l-2 border-gray-200 flex items-end px-2 pt-8" // เพิ่ม pt-8 เพื่อให้มีที่สำหรับตัวเลข
                        style={{ width: chartWidth }}
                    >
                        {data.map((item, index) => (
                            <div key={item.id} className="h-full flex flex-col justify-end items-center text-center px-2 relative" style={{ flex: '1 1 0px' }}>
                                {/* --- (ปรับแก้) แสดงตัวเลขบนแท่ง --- */}
                                <div className="absolute top-0 text-gray-700 text-xs font-bold">
                                    {item[dataKey].toLocaleString()}
                                </div>
                                <div className="w-full h-full flex items-end justify-center group">
                                    <div
                                        style={{ height: `${(item[dataKey] / maxValue) * 90}%` }} // ลดความสูงลงเล็กน้อยเพื่อไม่ให้ชนตัวเลข
                                        className={`w-full max-w-[50px] rounded-t-md transition-all duration-300 ease-out ${colors[index % colors.length]}`}
                                    >
                                    </div>
                                </div>
                                <p className="text-xs mt-2 text-gray-600 w-full truncate" title={item.name}>
                                    {item.name}
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

                {/* --- ประวัติการศึกษา, การสอน, และคติประจำใจ --- */}
                <div className="mt-8 space-y-8">
                    <div>
                        <h2 className="font-semibold mb-6">ประวัติการศึกษา</h2>
                        <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                            {educationHistory.map(edu => (
                                <div key={edu.id} className="pt-2 first:pt-0">
                                    <p className="text-sm font-semibold">{edu.level}</p>
                                    <p className="text-sm text-gray-600">{edu.university}</p>
                                    <p className="text-xs text-gray-500 mt-1">{`(${edu.startYear} - ${edu.endYear})`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h2 className="font-semibold mb-6">ประวัติการสอน</h2>
                        <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                            {teachingExperience.map(exp => (
                                <div key={exp.id} className="pt-2 first:pt-0">
                                    <p className="text-sm font-semibold">{exp.topic}</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{exp.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">{`(${exp.startYear} - ${exp.endYear})`}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                         <h2 className="font-semibold mb-6">คติประจำใจ</h2>
                        <div className="border border-gray-300 rounded-lg p-4">
                            <p className="text-sm text-gray-600">{motto}</p>
                        </div>
                    </div>
                </div>

                {/* --- ส่วนภาพรวมข้อมูลสถิติ --- */}
                <div className="mt-8">
                    <h2 className="font-semibold">ภาพรวมข้อมูลสถิติ</h2>
                    <p className="text-sm text-gray-500 mt-1">(อัปเดตเมื่อ {formattedCurrentDate})</p>
                    <div className="space-y-4 mt-6">
                        <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
                            <HiUsers className="w-6 h-6 text-gray-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">จำนวนนักเรียนที่ลงทะเบียนเรียนกับผู้สอนในปัจจุบัน</p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    {statsData.courses.map(course => (
                                        <li key={course.id}> {course.name}: <span className="font-semibold">{course.students.toLocaleString()} คน</span> </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
                            <FaGraduationCap className="w-6 h-6 text-gray-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">อัตราการเรียนจบคอร์ส</p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    {statsData.courses.map(course => ( <li key={course.id}> {course.name}: <span className="font-semibold">{course.completionRate}%</span> </li> ))}
                                </ul>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
                            <HiClipboardList className="w-6 h-6 text-gray-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">คะแนนเฉลี่ยของนักเรียนในแต่ละคอร์ส</p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    {statsData.courses.map(course => ( <li key={course.id}> {course.name}: <span className="font-semibold">{course.averageScore}/{course.maxScore}</span> </li> ))}
                                </ul>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
                            <HiStar className="w-6 h-6 text-gray-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">คอร์สที่ได้รับความนิยม</p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    {statsData.topPopularCourses.map(course => (
                                        <li key={course.id}>{course.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="border border-gray-300 rounded-lg p-4 flex items-start gap-4">
                            <RiHandCoinLine className="w-6 h-6 text-gray-500 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">รายได้</p>
                                <ul className="list-disc list-inside mt-2 text-sm text-gray-700 space-y-1">
                                    {statsData.courses.map(course => ( <li key={course.id}> {course.name} - <span className="font-semibold">{course.revenue.toLocaleString()} บาท</span> </li> ))}
                                </ul>
                                <p className="font-semibold text-sm mt-3">รวมรายได้ทั้งหมด {statsData.totalRevenue.toLocaleString()} บาท</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ส่วนแผนภูมิ --- */}
                <div className='mt-8'>
                    <h2 className="font-semibold">แผนภูมิแสดงความก้าวหน้า</h2>
                    <div className='border border-gray-300 rounded-lg p-6 mt-6 space-y-12'>
                        <BarChart
                            data={statsData.courses}
                            dataKey="students"
                            title="จำนวนนักเรียนที่เรียนจบแล้วในแต่ละคอร์ส"
                            unit="คน"
                        />
                        <BarChart
                            data={statsData.courses}
                            dataKey="revenue"
                            title="รายได้"
                            unit="บาท"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;