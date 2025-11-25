'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown } from 'react-icons/fa';

// ข้อมูลตัวอย่างสำหรับใส่ใน dropdown
const curriculumData = [
    { id: '1', name: 'การออกแบบนวัตกรรมดิจิทัลและผลิตภัณฑ์ (Digital Innovation & Product Design)' },
    { id: '2', name: 'ข้อมูล เทคโนโลยี และกลยุทธ์ธุรกิจ (Data, Technology & Business Strategy)' },
    { id: '3', name: 'การวิเคราะห์ข้อมูลเพื่อการพัฒนาผลิตภัณฑ์ดิจิทัล (Data Analytics for Digital Product Development)' },
    { id: '4', name: 'เทคโนโลยีเพื่อการสร้างสรรค์ผลิตภัณฑ์และประสบการณ์ผู้ใช้ (Tech-Driven Product & UX Creation)' },
    { id: '5', name: 'วิทยาการข้อมูลและการออกแบบที่ขับเคลื่อนด้วยผู้ใช้ (Data Science & User-Centered Design)' },
    { id: '6', name: 'การจัดการผลิตภัณฑ์ดิจิทัลและนวัตกรรมทางธุรกิจ (Digital Product Management & Business Innovation)' },
    { id: '7', name: 'เทคโนโลยีเกิดใหม่และการออกแบบอนาคต (Emerging Tech & Future Design)' },
    { id: '8', name: 'การใช้ข้อมูลเพื่อสร้างกลยุทธ์ธุรกิจที่ยั่งยืน (Data-Driven Sustainable Business Strategy)' },
    { id: '9', name: 'AI และการออกแบบเชิงสร้างสรรค์สำหรับธุรกิจดิจิทัล (AI & Creative Design for Digital Business)' },
    { id: '10', name: 'การบูรณาการข้อมูล เทคโนโลยี และการออกแบบเพื่อสร้างคุณค่า (Integrating Data, Tech & Design for Value Creation)' },
    { id: '11', name: 'นวัตกรรมการวิเคราะห์ข้อมูลเพื่อธุรกิจและผลิตภัณฑ์ (Innovative Data Analytics for Business & Product)' },
    { id: '12', name: 'โครงงานสร้างผลิตภัณฑ์ดิจิทัลแบบครบวงจร (Capstone: End-to-End Digital Product Creation)' },
];


const ManageCurriculumPage = () => {
    const [selectedCurriculum, setSelectedCurriculum] = useState('');
    const router = useRouter();

    // States for Combobox
    const [searchQuery, setSearchQuery] = useState('');
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const comboboxRef = useRef<HTMLDivElement>(null);

    // Hook to close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsOptionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter curriculum for the Combobox
    const filteredCurriculum = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            return curriculumData;
        }
        return curriculumData.filter(curriculum =>
            curriculum.name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // --- 📌 CHANGE HERE ---
    // Function to handle navigation with query parameter
    const handleEditClick = (curriculumId: string) => {
        router.push(`/universities-staff/edit-curriculum?id=${curriculumId}`);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* --- Page Header --- */}
                <h1 className="text-2xl font-semibold mb-6">การจัดการหลักสูตร</h1>

                {/* --- Manage Curriculum Card --- */}
                <div className="bg-[#414E51] p-4 sm:p-8 rounded-xl shadow-lg mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">จัดการหลักสูตร</h2>
                    <div>
                        {/* Container for the combobox */}
                        <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-lg mb-4">
                            <span className="rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none py-3 px-4 font-semibold text-sm border-b sm:border-b-0 sm:border-r border-gray-200 whitespace-nowrap bg-gray-50 sm:bg-transparent flex items-center sm:justify-start">
                                หลักสูตรที่ต้องการแก้ไข/ลบ
                            </span>
                            <div className="relative flex-grow " ref={comboboxRef}>
                                <input
                                    type="text"
                                    placeholder="กรุณาเลือก หรือ พิมพ์เพื่อค้นหา..."
                                    value={selectedCurriculum ? curriculumData.find(c => c.id === selectedCurriculum)?.name || '' : searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setSelectedCurriculum('');
                                        if (!isOptionsOpen) setIsOptionsOpen(true);
                                    }}
                                    onFocus={() => {
                                        setSearchQuery('');
                                        setIsOptionsOpen(true);
                                    }}
                                    className="rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none w-full h-full p-3 pr-10 bg-white appearance-none focus:outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FaChevronDown />
                                </button>
                                {isOptionsOpen && (
                                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredCurriculum.length > 0 ? (
                                            filteredCurriculum.map(curriculum => (
                                                <li
                                                    key={curriculum.id}
                                                    onClick={() => {
                                                        // When an item is clicked, set the selected curriculum and close the dropdown
                                                        setSelectedCurriculum(curriculum.id);
                                                        setSearchQuery(curriculum.name); // Show selected name in input
                                                        setIsOptionsOpen(false);
                                                        // Navigate to the edit page
                                                        handleEditClick(curriculum.id);
                                                    }}
                                                    className="p-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    {curriculum.name}
                                                </li>
                                            ))
                                        ) : (
                                            <li className="p-3 text-sm text-gray-500">ไม่พบข้อมูล</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/universities-staff/add-curriculum')}
                            className="w-full sm:w-auto bg-white text-sm font-semibold py-3 px-8 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            สร้างหลักสูตร
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageCurriculumPage;