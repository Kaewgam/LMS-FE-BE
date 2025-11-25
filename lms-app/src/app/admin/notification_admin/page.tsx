'use client';

import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

// ข้อมูลจำลองสำหรับตัวเลือก "อื่นๆ"
const additionalRecipients = [
    'ผู้เรียน : คอร์สภาษาอังกฤษ ป.4',
    'ผู้สอน : คอร์สภาษาอังกฤษ ป.6',
    'ผู้ดูแลสถาบัน',
    'ผู้สอน : คอร์สคณิตศาสตร์ ม.1'
];

const NotificationPage: React.FC = () => {
    // State สำหรับการจัดการสถานะการเลือกผู้รับ
    const [recipientType, setRecipientType] = useState<'all-users' | 'all-teachers' | 'all-students' | 'all' | 'other'>('all-users');
    // State สำหรับการจัดการสถานะ dropdown และค่าที่เลือก
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
    // State ใหม่สำหรับจัดการการพิมพ์ในช่องค้นหา
    const [inputValue, setInputValue] = useState<string>('');
    // State สำหรับหัวข้อและเนื้อหาการแจ้งเตือน
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    // จัดการการส่งฟอร์ม
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ตรวจสอบความถูกต้องของข้อมูล
        if (recipientType === 'other' && !selectedRecipient) {
            toast.error('กรุณาเลือกผู้รับ');
            return;
        }

        if (!subject.trim() || !message.trim()) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        // แสดงผลลัพธ์การส่งใน Toast
        let recipientText = '';
        switch (recipientType) {
            case 'all-users':
                recipientText = 'ผู้ดูแลระบบ';
                break;
            case 'all-teachers':
                recipientText = 'ผู้สอนทุกคน';
                break;
            case 'all-students':
                recipientText = 'ผู้เรียนทุกคน';
                break;
            case 'all':
                recipientText = 'ทั้งหมด';
                break;
            case 'other':
                recipientText = selectedRecipient;
                break;
        }

        toast.success(`ส่งแจ้งเตือนเรียบร้อยแล้ว!`);

        // รีเซ็ตค่าในฟอร์ม
        setRecipientType('all-users');
        setSelectedRecipient('');
        setInputValue(''); // รีเซ็ตค่าในช่องค้นหา
        setSubject('');
        setMessage('');
    };

    // กรองรายชื่อผู้รับตามสิ่งที่พิมพ์
    const filteredRecipients = additionalRecipients.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase())
    );

    return (
        <div className="min-h-screen p-4 sm:p-8 mt-[-15px] font-sans antialiased">
            {/* --- ส่วนที่แก้ไข: เพิ่ม toastOptions --- */}
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
                    success: {
                        style: {
                            background: '#F0FDF4',
                            color: 'black',
                        },
                    },
                    error: {
                        style: {
                            background: '#FFF1F2',
                            color: 'black',
                        },
                    },
                }}
            />

            <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-lg border border-gray-300 space-y-6">
                <h1 className="text-2xl sm:text-3xl font-semibold  tracking-tight">การส่งแจ้งเตือน</h1>
                <hr className="border-gray-300" />
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ส่วน ผู้รับข้อความ */}
                    <div className="space-y-3">
                        <label className="block  font-medium text-sm md:text-base">ผู้รับข้อความ :</label>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                            {/* Radio Buttons */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="all-users"
                                    name="recipientType"
                                    checked={recipientType === 'all-users'}
                                    onChange={() => { setRecipientType('all-users'); setSelectedRecipient(''); setIsDropdownOpen(false); setInputValue(''); }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="all-users" className="text-sm sm:text-base  font-medium">ผู้ดูแลสถาบัน</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="all-teachers"
                                    name="recipientType"
                                    checked={recipientType === 'all-teachers'}
                                    onChange={() => { setRecipientType('all-teachers'); setSelectedRecipient(''); setIsDropdownOpen(false); setInputValue(''); }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="all-teachers" className="text-sm sm:text-base  font-medium">ผู้สอนทุกคน</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="all-students"
                                    name="recipientType"
                                    checked={recipientType === 'all-students'}
                                    onChange={() => { setRecipientType('all-students'); setSelectedRecipient(''); setIsDropdownOpen(false); setInputValue(''); }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="all-students" className="text-sm sm:text-base  font-medium">ผู้เรียนทุกคน</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="all"
                                    name="recipientType"
                                    checked={recipientType === 'all'}
                                    onChange={() => { setRecipientType('all'); setSelectedRecipient(''); setIsDropdownOpen(false); setInputValue(''); }}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="all" className="text-sm sm:text-base  font-medium">ทั้งหมด</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    id="other"
                                    name="recipientType"
                                    checked={recipientType === 'other'}
                                    onChange={() => setRecipientType('other')}
                                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <label htmlFor="other" className="text-sm sm:text-base  font-medium">อื่น ๆ</label>
                            </div>

                            {/* Dropdown ที่สามารถค้นหาได้สำหรับ "อื่น ๆ" */}
                            {recipientType === 'other' && (
                                <div className="relative w-full max-w-sm">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => {
                                                setInputValue(e.target.value);
                                                setSelectedRecipient(''); // ล้างค่าที่เลือกไว้เมื่อเริ่มพิมพ์ใหม่
                                                if (!isDropdownOpen) setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // หน่วงเวลาก่อนปิด dropdown
                                            placeholder="กรุณาเลือกหรือค้นหา"
                                            className="w-full text-left py-2 px-3 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                        <ChevronDownIcon
                                            className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </div>

                                    {isDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {filteredRecipients.length > 0 ? (
                                                filteredRecipients.map((option) => (
                                                    <div
                                                        key={option}
                                                        onClick={() => {
                                                            setSelectedRecipient(option);
                                                            setInputValue(option); // อัปเดต input ให้ตรงกับที่เลือก
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {option}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-2 text-gray-500">ไม่พบข้อมูล</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ส่วน หัวข้อเรื่อง */}
                    <div className="space-y-3">
                        <label htmlFor="subject" className="block  font-medium text-sm md:text-base">หัวข้อเรื่อง</label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                            placeholder="หัวข้อการแจ้งเตือน"
                        />
                    </div>

                    {/* ส่วน ข้อความที่ต้องการแจ้งเตือน */}
                    <div className="space-y-3">
                        <label htmlFor="message" className="block  font-medium text-sm md:text-base">ข้อความที่ต้องการแจ้งเตือน</label>
                        <textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                            placeholder="กรอกข้อความที่นี่..."
                        />
                    </div>

                    {/* ปุ่ม ส่งแจ้งเตือน */}
                    <div className="flex justify-center pt-4">
                        <button
                            type="submit"
                            className="w-full max-w-xs py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none "
                        >
                            ส่งแจ้งเตือน
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NotificationPage;
