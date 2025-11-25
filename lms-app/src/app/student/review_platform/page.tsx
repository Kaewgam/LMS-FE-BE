'use client';

import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

// --- ส่วนที่ 1: การ์ดเชิญชวนให้รีวิว ---
const ReviewPrompt = ({ onStartReview }: { onStartReview: () => void }) => (
    <div className="w-full  max-w-lg mx-auto bg-[#414E51] text-white rounded-2xl shadow-lg p-10 text-center flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-3">
            กำลังเพลิดเพลินไปกับ LMS ใช่ไหม?
        </h2>
        <p className=" mb-8">
            รีวิวเพื่อให้พวกเรานำไปพัฒนาต่อนะ
        </p>
        <button
            onClick={onStartReview}
            className="bg-[#ffffff] cursor-pointer text-black font-semibold py-3 px-8 rounded-full transition-transform duration-200 hover:bg-gray-200"
        >
            รีวิวแพลตฟอร์มนี้
        </button>
    </div>
);

// --- ส่วนที่ 2: ฟอร์มสำหรับรีวิว ---
const ReviewForm = ({ onSubmit }: { onSubmit: (data: { rating: number; comment: string }) => void }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error('กรุณาให้คะแนนอย่างน้อย 1 ดาว');
            return;
        }
        onSubmit({ rating, comment });
        toast.success('ขอบคุณสำหรับรีวิวของคุณ!');
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-300 p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
                รู้สึกอย่างไรกับ LMS?
            </h3>
            <p className="text-gray-500 mb-6">
                ความคิดเห็นของคุณมีความสำคัญต่อการพัฒนาของเรา
            </p>
            
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors duration-200"
                placeholder="เขียนความคิดเห็นของคุณที่นี่..."
            />
            
            <div className="mt-8">
                <p className="font-semibold text-gray-800 mb-4">คะแนน LMS</p>
                <div 
                    className="flex items-center text-4xl text-gray-300"
                    onMouseLeave={() => setHoverRating(0)}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                            key={star}
                            className="cursor-pointer transition-colors duration-200"
                            color={(hoverRating || rating) >= star ? '#FBBF24' : '#E5E7EB'}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
                
            </div>

            <div className="mt-10 text-right">
                <button
                    onClick={handleSubmit}
                    className="bg-blue-500 text-white font-semibold cursor-pointer py-3 px-10 rounded-full transition-all duration-200 hover:bg-blue-600 hover:shadow-lg"
                >
                    ส่งรีวิว
                </button>
            </div>
        </div>
    );
};


// --- คอมโพเนนต์หลักสำหรับจัดการการแสดงผล ---
const PlatformReview = () => {
    const [isReviewing, setIsReviewing] = useState(false);

    const handleStartReview = () => {
        setIsReviewing(true);
    };

    const handleSubmitReview = (data: { rating: number; comment: string }) => {
        console.log('Review Submitted:', data);
        // ในขั้นตอนนี้ คุณสามารถส่งข้อมูล `data` ไปยัง API ของคุณได้
        // หลังจากส่งสำเร็จ อาจจะซ่อนฟอร์มและแสดงข้อความขอบคุณ
        setTimeout(() => {
            setIsReviewing(false); // กลับไปหน้าแรกหลังจาก 3 วินาที (เป็นตัวอย่าง)
        }, 3000);
    };

    return (
        <div className="mt-15  flex items-center justify-center p-4 font-sans">
            {/* [แก้ไข] เพิ่ม Style ให้กับ Toaster ที่นี่ */}
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
            {isReviewing ? (
                <ReviewForm onSubmit={handleSubmitReview} />
            ) : (
                <ReviewPrompt onStartReview={handleStartReview} />
            )}
        </div>
    );
};

export default PlatformReview;