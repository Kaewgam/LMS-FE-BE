'use client';

import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ReportProblemPage: React.FC = () => {
    const [subject, setSubject] = useState('');
    const [details, setDetails] = useState('');

    const handleSubmit = () => {
        if (!subject.trim() || !details.trim()) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        // Logic to send data to a server would go here
        
        toast.success('ส่งคำร้องเรียนของคุณเรียบร้อยแล้ว');
        setSubject('');
        setDetails('');
    };

    return (
        <div className="min-h-screen p-4 sm:p-8 flex justify-center font-sans">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: {
                        borderRadius: '8px',
                        background: '#333',
                        color: '#fff',
                        fontSize: '16px',
                        padding: '16px 24px',
                        fontWeight: '600',
                    },
                    success: {
                        style: {
                            background: '#F0FDF4',
                            color: 'black',
                        },
                        iconTheme: {
                            primary: '#22C55E',
                            secondary: 'white',
                        },
                    },
                    error: {
                        style: {
                            background: '#FFF1F2',
                            color: 'black',
                        },
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: 'white',
                        },
                    },
                }}
            />
            
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border-gray-300 border p-6 sm:p-8 space-y-8">
                
                {/* --- Header --- */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold ">แจ้งปัญหาการใช้งาน</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        กรุณากรอกรายละเอียดปัญหาที่ท่านพบ เราจะรีบดำเนินการตรวจสอบให้เร็วที่สุด
                    </p>
                </div>

                {/* --- Form --- */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="subject" className="block text-sm font-semibold  mb-2">
                            หัวข้อเรื่อง
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                            placeholder="เช่น: วิดีโอไม่เล่น, เข้าระบบไม่ได้"
                        />
                    </div>

                    <div>
                         <label htmlFor="details" className="block text-sm font-semibold  mb-2">
                            รายละเอียดปัญหา
                        </label>
                        <textarea
                            id="details"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={10}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                            placeholder="กรอกรายละเอียดปัญหาของคุณที่นี่..."
                        />
                    </div>
                </div>

                {/* --- Footer / Submit Button --- */}
                <div className="pt-6 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-blue-700 transition-colors shadow focus:outline-none  focus:ring-opacity-50"
                    >
                        ส่งคำร้องเรียน
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ReportProblemPage;