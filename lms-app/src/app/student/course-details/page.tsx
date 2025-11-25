'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiLock, FiClock, FiUsers, FiChevronLeft, FiChevronRight, FiStar, FiChevronDown, FiX } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// --- 1. Mock Data ---
const courseDetailsData = {
    title: 'Data Visualization',
    bannerImageUrl: '/images/50.png',
    description: 'สอนการวิเคราะห์ข้อมูลพร้อมใช้ เพื่อช่วยตัดสินใจทางธุรกิจอย่างมีประสิทธิภาพ',
    duration: '20 ชั่วโมง',
    studentCount: 30,
};
const lessonsData = [
    { chapter: 1, title: 'Data Visualization คืออะไร', imageUrl: '/images/50.png' },
    { chapter: 2, title: 'ประโยชน์ Data Visualization', imageUrl: '/images/50.png' },
    { chapter: 3, title: 'การนำ Data Visualization ไปใช้งาน', imageUrl: '/images/50.png' },
];
const unlockedLessonsData = [
    ...lessonsData,
    { chapter: 4, title: 'หลักการออกแบบ Dashboard ที่ดี', imageUrl: '/images/50.png' },
    { chapter: 5, title: 'Workshop: สร้าง Dashboard ด้วย Google Looker Studio', imageUrl: '/images/50.png' },
    { chapter: 6, title: 'การเลือกใช้กราฟให้เหมาะกับข้อมูล', imageUrl: '/images/50.png' },
    { chapter: 7, title: 'Case Study: การใช้ Data Visualization ในธุรกิจจริง', imageUrl: '/images/50.png' },
];
const instructorData = {
    name: 'ผศ.ดร. เอเดน มิเลอร์',
    education: 'ปริญญาเอกบ้านน้ำกรอง',
    expertise: 'Data',
    imageUrl: '/images/40.png'
};
const reviewsData = [
    { name: 'ศุภวิช สุขสวัสดิ์', rating: 5, comment: 'อาจารย์สอนดี สอนเข้าใจง่าย หนูจะสอบเอาเกียรตินิยมให้ได้' },
    { name: 'สมชาย ใจดี', rating: 4, comment: 'เนื้อหาครอบคลุมดีมากครับ สามารถนำไปปรับใช้ได้จริง' },
    { name: 'มานี ชูใจ', rating: 5, comment: 'คอร์สนี้เปลี่ยนมุมมองการใช้ข้อมูลของดิฉันไปเลยค่ะ ยอดเยี่ยม!' }
];
const overallRating = 4.5;
const faqData = [
    {
        question: 'Data Visualization ต่างจากการทำกราฟธรรมดาอย่างไร?',
        answer: 'กราฟธรรมดามุ่ง "แสดงตัวเลข" แต่ Data Visualization มุ่ง "เล่าเรื่อง" (Storytelling) โดยผูกข้อมูลดิบหลักการรับรู้ของมนุษย์ เช่น การใช้สีขนาด ตำแหน่ง และปฏิสัมพันธ์ (interaction) เพื่อให้ผู้ชมเข้าใจความสัมพันธ์ แนวโน้ม และสาเหตุ ได้เร็วกว่าอ่านตารางตัวเลขเพียวๆ',
    },
    {
        question: 'ทำไม Data Visualization ถึงจำเป็นในยุคนี้?',
        answer: 'ปริมาณข้อมูลเติบโตแบบ Exponential; การแสดงผลที่ดีช่วย\n1.ลดเวลาตัดสินใจทางธุรกิจ\n2.ค้นหา Insight ที่ซ่อนอยู่ได้เร็ว\n3.สื่อสารผลวิเคราะห์ให้คนที่ไม่เชี่ยวชาญด้านข้อมูลเข้าใจได้ทันที',
    },
    {
        question: 'วิชานี้เชื่อมโยงกับ Data Science / Business Intelligence อย่างไร?',
        answer: 'Visualization เป็นขั้นตอนปลายน้ำของ Data Science (หลัง Clean/Model) และเป็นหัวใจหลักของ Business Intelligence (BI) เพราะผลลัพธ์สุดท้ายต้อง "ขึ้นจอ" ให้ผู้บริหารใช้ตัดสินใจ',
    },
];

// --- 3. Sub-Components ---
const TabButton = ({ title, isActive, onClick }: { title: string, isActive: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`py-4 px-1 inline-flex items-center gap-2 text-md font-medium whitespace-nowrap ${isActive ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500 hover:text-blue-600'}`}>
        {title}
    </button>
);

const FaqItem = ({ faq, isOpen, onClick }: { faq: { question: string, answer: string }, isOpen: boolean, onClick: () => void }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
            <button
                onClick={onClick}
                className="flex justify-between items-center w-full text-left p-6"
            >
                <span className={`text-lg font-semibold ${isOpen ? 'text-black' : 'text-black'}`}>
                    Q : {faq.question}
                </span>
                <FiChevronDown
                    className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'transform rotate-180 ' : 'text-black'}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px]' : 'max-h-0'}`}
            >
                <div className="px-6 pb-6 text-black leading-relaxed">
                    <p className="whitespace-pre-line">
                        <span className="font-semibold text-black">A :</span> {faq.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const UnlockModal = ({
    onClose,
    onSubmit,
    codeInput,
    onCodeChange,
    error
}: {
    onClose: () => void;
    onSubmit: () => void;
    codeInput: string;
    onCodeChange: (value: string) => void;
    error: string | null;
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 1) return;
        const newCode = codeInput.split('');
        newCode[index] = value;
        onCodeChange(newCode.join('').slice(0, 6));
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !codeInput[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (pastedData) {
            onCodeChange(pastedData);
            const nextFocusIndex = Math.min(pastedData.length, 5);
            inputRefs.current[nextFocusIndex]?.focus();
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <FiX size={24} />
                </button>
                <h2 className="text-2xl font-semibold mb-4">ใส่รหัสเพื่อปลดล็อก</h2>
                <p className="text-gray-600 mb-8">กรอกรหัส 6 หลักเพื่อเข้าถึงเนื้อหาทั้งหมด</p>
                <div className="flex justify-center gap-2 sm:gap-4">
                    {[...Array(6)].map((_, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="tel"
                            maxLength={1}
                            value={codeInput[index] || ''}
                            onChange={(e) => handleInputChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold border-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    ))}
                </div>
                {error && (<p className="text-red-500 mt-4 text-sm">{error}</p>)}
                <button
                    onClick={onSubmit}
                    className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg mt-8 hover:bg-blue-700 transition-colors"
                >
                    ยืนยันรหัส
                </button>
            </div>
        </div>
    );
};

const CourseReviewSection = () => {
    const [isReviewing, setIsReviewing] = useState(false);
    const [expectationsRating, setExpectationsRating] = useState(0);
    const [courseRating, setCourseRating] = useState(0);
    const [comment, setComment] = useState('');
    const handleSubmitReview = () => {
        if (expectationsRating === 0 || courseRating === 0) {
            toast.error('กรุณาให้คะแนนให้ครบทั้ง 2 ส่วน');
            return;
        }
        const reviewData = {
            comment,
            expectationsRating,
            courseRating,
        };
        console.log('Course Review Submitted:', reviewData);
        toast.success('ขอบคุณสำหรับรีวิวคอร์สเรียน!');
        setTimeout(() => {
            setIsReviewing(false); 
        }, 3000);
    };
    const StarRating = ({ rating, setRating, hoverRating, setHoverRating }: any) => (
        <div className="flex items-center text-4xl text-gray-300" onMouseLeave={() => setHoverRating(0)}>
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
    );
    const [hoverExpectations, setHoverExpectations] = useState(0);
    const [hoverCourse, setHoverCourse] = useState(0);

    // --- (✨ ปรับปรุง) แก้ไข UI ส่วน Prompt ให้เหมือนกับส่วน Quiz ---
    if (!isReviewing) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    เรียนจบแล้วใช่ไหม?
                </h2>
                <p className="text-gray-600 mb-8 max-w-md">
                    แบ่งปันความคิดเห็นของคุณเพื่อช่วยให้ผู้เรียนคนอื่นตัดสินใจได้ง่ายขึ้น
                </p>
                <button
                    onClick={() => setIsReviewing(true)}
                    className="bg-blue-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105"
                >
                    รีวิวคอร์สเรียนนี้
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8">
            <div>
                <label className="block font-semibold text-gray-800 mb-2">คุณรู้สึกอย่างไรกับคอร์สนี้?</label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-1 focus:ring-gray-300"
                    placeholder="เขียนความคิดเห็นของคุณที่นี่..."
                />
            </div>
            <div className="space-y-2">
                <label className="block font-semibold text-gray-800">คอร์สนี้เป็นไปตามคาดหวังของผู้เรียนมากน้อยแค่ไหน</label>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">ไม่เป็นไปตามคาดหวัง</span>
                    <StarRating rating={expectationsRating} setRating={setExpectationsRating} hoverRating={hoverExpectations} setHoverRating={setHoverExpectations} />
                    <span className="text-sm text-gray-500">เป็นไปตามที่คาดหวังมากที่สุด</span>
                </div>
            </div>
            <div className="space-y-2">
                <label className="block font-semibold text-gray-800">คะแนนคอร์ส</label>
                <StarRating rating={courseRating} setRating={setCourseRating} hoverRating={hoverCourse} setHoverRating={setHoverCourse} />
            </div>
            <div className="text-right pt-4">
                <button
                    onClick={handleSubmitReview}
                    className="bg-blue-600 text-white font-semibold cursor-pointer py-3 px-10 rounded-full transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
                >
                    ส่งรีวิว
                </button>
            </div>
        </div>
    );
};


// --- 2. Main Component: CourseDetailsPage ---
const CourseDetailsPage = () => {
    const [activeTab, setActiveTab] = useState('lessons');
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [codeInput, setCodeInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const CORRECT_UNLOCK_CODE = '123456';

    const handleFaqClick = (index: number) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const nextReview = () => { setCurrentReviewIndex((prev) => (prev + 1) % reviewsData.length); };
    const prevReview = () => { setCurrentReviewIndex((prev) => (prev - 1 + reviewsData.length) % reviewsData.length); };
      
    const handleUnlockSubmit = () => {
        if (codeInput === CORRECT_UNLOCK_CODE) {
            setIsUnlocked(true);
            setIsModalOpen(false);
            setCodeInput('');
            setError(null);
        } else {
            setError('รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        }
    };
      
    const handleOpenModal = () => {
        setError(null);
        setIsModalOpen(true);
    };
      
    const displayLessons = isUnlocked ? unlockedLessonsData : lessonsData;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'lessons':
                return (
                    <div className="space-y-6">
                        {displayLessons.map((lesson) => (
                            <div key={lesson.chapter} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row items-center gap-6">
                                <img src={lesson.imageUrl} alt={lesson.title} className="w-full md:w-56 h-auto rounded-md object-cover" />
                                <div className="flex flex-col flex-grow self-stretch">
                                    <div className="flex-grow text-center md:text-left">
                                        <h3 className="mb-3 font-semibold">บทที่ {lesson.chapter}</h3>
                                        <p className="font-semibold text-gray-800 mt-1">{lesson.title}</p>
                                    </div>
                                    <Link href={`/student/course-details/lesson?lessonId=${lesson.chapter}&isUnlocked=${isUnlocked}`}>
                                        <button className="bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full md:w-auto mt-4 md:mt-0 md:self-end">
                                            ดูเนื้อหา
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'instructor':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-8">
                        <img src={instructorData.imageUrl} alt={instructorData.name} className="w-48 h-auto object-cover rounded-2xl" />
                        <div className="text-center sm:text-left mt-4 sm:mt-0">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{instructorData.name}</h3>
                            <p className="text-md text-gray-700">การศึกษา: {instructorData.education}</p>
                            <p className="text-md text-gray-700 mt-2">ความเชี่ยวชาญ: {instructorData.expertise}</p>
                        </div>
                    </div>
                );
            case 'reviews':
                const currentReview = reviewsData[currentReviewIndex];
                const roundedOverallRating = Math.round(overallRating);
                return (
                    <div className="bg-white p-6 sm:p-8 rounded-lg border border-gray-200">
                        <div className="flex items-center mb-4 flex-wrap">
                                {[...Array(5)].map((_, i) => (
                                    <FiStar key={i} className={`w-7 h-7 ${i < roundedOverallRating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" />
                                ))}
                                <span className="ml-3 text-2xl font-bold text-gray-800">{overallRating}</span>
                                <span className="ml-2 text-gray-500">({reviewsData.length} รีวิว)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 items-center">
                                <div className="text-center">
                                    <p className="text-gray-600">ความคาดหวังของผู้เรียน</p>
                                    <p className="text-5xl font-bold text-gray-900 my-2">100%</p>
                                    <p className="text-gray-600 mb-6">ของรีวิวบอกว่าคอร์สนี้</p>
                                    <button className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-full transition-colors">ตรงตามความคาดหวังของผู้เรียน</button>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={prevReview} className="p-2 rounded-full hover:bg-gray-100"><FiChevronLeft className="w-6 h-6 text-gray-600" /></button>
                                    <div className="flex-grow text-center">
                                        <div className="flex items-center justify-center mb-2 flex-wrap">
                                            <span className="font-semibold">{currentReview.name}</span>
                                            <div className="flex ml-3">
                                                {[...Array(5)].map((_, i) => (<FiStar key={i} className={`w-4 h-4 ${i < currentReview.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" />))}
                                            </div>
                                        </div>
                                        <div className="border rounded-xl p-6 text-center">
                                            <p className="text-gray-700">“{currentReview.comment}”</p>
                                        </div>
                                    </div>
                                    <button onClick={nextReview} className="p-2 rounded-full hover:bg-gray-100"><FiChevronRight className="w-6 h-6 text-gray-600" /></button>
                                </div>
                        </div>
                    </div>
                );
            case 'faq':
                return (
                    <div className="space-y-4">
                        {faqData.map((faq, index) => (
                            <FaqItem
                                key={index}
                                faq={faq}
                                isOpen={openFaqIndex === index}
                                onClick={() => handleFaqClick(index)}
                            />
                        ))}
                    </div>
                );
            
            case 'quiz':
                return (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">
                            เรียนจบแล้วใช่ไหม?
                        </h2>
                        <p className="text-gray-600 mb-8 max-w-md">
                            มาเริ่มทำแบบทดสอบเพื่อวัดความเข้าใจในเนื้อหาทั้งหมดที่คุณได้เรียนไป
                        </p>
                        <Link href="/student/course-details/quiz">
                            <button className="bg-blue-600 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-blue-700 transition-colors transform hover:scale-105">
                                เริ่มทำแบบทดสอบ
                            </button>
                        </Link>
                    </div>
                );
            
            case 'course-review':
                return <CourseReviewSection />;
                
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <Toaster position="top-center" reverseOrder={false} />

            {isModalOpen && (
                <UnlockModal
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleUnlockSubmit}
                    codeInput={codeInput}
                    onCodeChange={setCodeInput}
                    error={error}
                />
            )}

            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

                <header className="grid grid-cols-1 lg:grid-cols-2 items-stretch rounded-xl shadow-md overflow-hidden border border-gray-200">
                    <div className="relative"><img src={courseDetailsData.bannerImageUrl} alt={courseDetailsData.title} className="w-full h-full object-cover"/></div>
                    <div className="bg-white p-6 flex flex-col">
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <h1 className="text-xl font-bold text-gray-900">{courseDetailsData.title}</h1>
                                {!isUnlocked && <FiLock className="text-gray-400 w-5 h-5 flex-shrink-0" />}
                            </div>
                            <p className="text-gray-600 mt-2 ">{courseDetailsData.description}</p>
                        </div>
                        <div className="mt-4 space-y-2 text-gray-700 text-sm">
                            <div className="flex items-center"><FiClock className="w-4 h-4 mr-2 text-gray-500" /><span>{courseDetailsData.duration}</span></div>
                            <div className="flex items-center"><FiUsers className="w-4 h-4 mr-2 text-gray-500" /><span>{courseDetailsData.studentCount}</span></div>
                        </div>
                    </div>
                </header>

                <div className="mt-12 border-b border-gray-200">
                    <nav className="flex space-x-8 -mb-px overflow-x-auto">
                        <TabButton title={`บทเรียน (${unlockedLessonsData.length})`} isActive={activeTab === 'lessons'} onClick={() => setActiveTab('lessons')} />
                        <TabButton title="ผู้สอน" isActive={activeTab === 'instructor'} onClick={() => setActiveTab('instructor')} />
                        <TabButton title="รีวิวจากผู้เรียน" isActive={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} />
                        <TabButton title="คำถามที่พบบ่อย" isActive={activeTab === 'faq'} onClick={() => setActiveTab('faq')} />
                        
                        {isUnlocked && (
                            <>
                               <TabButton title="แบบทดสอบ" isActive={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
                               <TabButton title="รีวิวคอร์สเรียน" isActive={activeTab === 'course-review'} onClick={() => setActiveTab('course-review')} />
                            </>
                        )}
                    </nav>
                </div>

                <main className="mt-8 pb-24">
                    {renderTabContent()}
                </main>
            </div>

            {!isUnlocked && (
                <div className="w-full flex justify-center p-4 fixed bottom-0 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 text-white font-semibold text-lg px-10 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
                    >
                        ใส่รหัสเพื่อปลดล็อกคอร์สเรียน
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseDetailsPage;