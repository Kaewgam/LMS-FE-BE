'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// ไอคอนที่ใช้
import { FileX2, Search, Users, Clock, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { FaChevronDown } from 'react-icons/fa';
// เพิ่ม Toaster และ toast สำหรับการแจ้งเตือน
import toast, { Toaster } from 'react-hot-toast';


// --- ข้อมูลจำลอง ---

const mockCourses = [
    { id: 1, title: 'Data Visualization', description: 'สอนการวิเคราะห์ข้อมูลพร้อมใช้ เพื่อช่วยตัดสินใจทางธุรกิจอย่างมีประสิทธิภาพ', image: '/images/50.png', status: 'ผ่านการอนุมัติ', students: 2, duration: 20 },
    { id: 2, title: 'Advanced React Development', description: 'เรียนรู้เทคนิคการเขียน React สำหรับโปรเจกต์ขนาดใหญ่ พร้อมการทำ State Management', image: '/images/50.png', status: 'รอดำเนินการ', students: 52, duration: 45 },
    { id: 3, title: 'Introduction to UI/UX', description: 'ปูพื้นฐานการออกแบบ UI/UX ที่ดี เพื่อสร้างประสบการณ์ที่ดีให้ผู้ใช้งาน', image: '/images/50.png', status: 'ไม่ผ่านการอนุมัติ', students: 105, duration: 15 },
    { id: 4, title: 'Basic Marketing', description: 'จำลองกรณีสร้างใหม่ยังไม่มีข้อมูล', image: '/images/50.png', status: 'ผ่านการอนุมัติ', students: 1, duration: 10 }
];

const initialStudents = [
    { id: 1, studentId: '65000001', name: 'สมชาย ใจดี', courseId: 1 },
    { id: 2, studentId: '65000002', name: 'สมหญิง จริงใจ', courseId: 1 },
    { id: 3, studentId: '65000003', name: 'กวินทร์ ไปดี', courseId: 4 },
];

// --- Confirmation Modal Component ---
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    const isDeleteAction = title.includes('ลบ');
    const confirmButtonColor = isDeleteAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
    return (
        <div className="fixed inset-0 flex justify-center items-center z-50  bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-500" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer">ยกเลิก</button>
                    <button onClick={onConfirm} className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor} cursor-pointer`}>ยืนยัน</button>
                </div>
            </div>
        </div>
    );
};


const Page = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [students, setStudents] = useState(initialStudents);
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const router = useRouter();

    const approvedCourses = useMemo(() => {
        const filtered = mockCourses.filter(course =>
            course.status === 'ผ่านการอนุมัติ' &&
            course.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return [...filtered].sort((a, b) => {
            if (sortOrder === 'newest') return b.id - a.id;
            return a.id - b.id;
        });
    }, [searchTerm, sortOrder]);

    const selectedCourse = useMemo(() => {
        if (!selectedCourseId) return null;
        return mockCourses.find(c => c.id === selectedCourseId);
    }, [selectedCourseId]);

    const studentsInCourse = useMemo(() => {
        if (!selectedCourseId) return [];
        return students.filter(s => s.courseId === selectedCourseId);
    }, [selectedCourseId, students]);

    const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };
    const closeConfirmationModal = () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleDeleteStudent = (student: {id: number, name: string}) => {
        openConfirmationModal(
            'ยืนยันการลบ',
            `คุณแน่ใจหรือไม่ว่าต้องการลบนักเรียน "${student.name}" ออกจากคอร์สนี้?`,
            () => {
                setStudents(prevStudents => prevStudents.filter(s => s.id !== student.id));
                toast.success(`ลบนักเรียน "${student.name}" เรียบร้อยแล้ว`);
                closeConfirmationModal();
            }
        );
    };

    const renderStudentTable = () => (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full w-full table-fixed text-left text-base">
                    <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                        <tr>
                            <th scope="col" className="w-1/4 px-6 py-4 font-medium text-center">#</th>
                            <th scope="col" className="w-1/4 px-6 py-4 font-medium text-center">ID</th>
                            <th scope="col" className="w-1/4 px-6 py-4 font-medium text-center">ชื่อ</th>
                            <th scope="col" className="w-1/4 px-6 py-4 font-medium text-center">การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInCourse.map((student, index) => (
                            <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-6 py-4 text-center">{index + 1}</td>
                                <td className="px-6 py-4 text-center">{student.studentId}</td>
                                <td className="px-6 py-4 font-medium text-center">{student.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStudent(student);
                                        }}
                                        className="text-red-600 hover:text-red-800 transition-colors inline-flex items-center justify-center"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             {studentsInCourse.length === 0 && (
                <p className="text-center text-gray-500 py-10">ไม่มีนักเรียนในคอร์สนี้</p>
            )}
        </div>
    );
    
    const renderCourseCard = (course: any) => (
         <div key={course.id} onClick={() => setSelectedCourseId(course.id)} className="flex flex-col lg:flex-row bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md cursor-pointer">
            <div className="relative w-full lg:w-2/5 flex-shrink-0">
                <img src={course.image} alt={course.title} className="w-full h-auto object-cover aspect-video lg:aspect-auto lg:h-full" />
            </div>
            <div className="w-full lg:w-3/5 p-6 flex flex-col">
                <div className="flex justify-end mb-2">
                    <span className="text-sm sm:text-base px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">{course.status}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mt-1">{course.title}</h2>
                <p className="text-base mb-4 flex-grow leading-relaxed text-gray-600">{course.description}</p>
                <div className="text-base mt-auto">
                    <div className="flex items-center text-gray-500 mb-2">
                        <Clock size={18} className="mr-2" />
                        <span>{course.duration} ชั่วโมง</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                        <Users size={18} className="mr-2" />
                        <span>{course.students} คน</span>
                    </div>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ========== CHANGE: เพิ่ม Style ให้ Toaster ========== */}
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
                            background: '#F0FDF4', // สีเขียว
                            color: 'black',
                        },
                    },
                    error: {
                        style: {
                            background: '#FFF1F2', // สีแดง
                            color: 'black',
                        },
                    },
                }}
            />
            
            <ConfirmationModal 
                isOpen={confirmationModal.isOpen} 
                onClose={closeConfirmationModal} 
                onConfirm={confirmationModal.onConfirm} 
                title={confirmationModal.title} 
                message={confirmationModal.message} 
            />

            {selectedCourse ? (
                <div>
                    <button onClick={() => setSelectedCourseId(null)} className="flex items-center gap-2 text-base text-gray-700 hover:text-black mb-6">
                        <ArrowLeft size={18} />
                        กลับไปหน้าคอร์สทั้งหมด
                    </button>
                    {renderCourseCard(selectedCourse)}
                    {renderStudentTable()}
                </div>
            ) : (
                <>
                    <header className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-4 mb-8">
                         <div className="relative w-full sm:w-auto">
                           <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ค้นหาชื่อคอร์ส..." className="w-full appearance-none text-base border border-gray-300 rounded-md pl-8 pr-4 py-2 focus:outline-none focus:ring-1 hover:bg-gray-50 focus:ring-gray-300" />
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        </div>
                        <div className="relative w-full sm:w-auto">
                           <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full appearance-none text-base border border-gray-300 rounded-md pl-3 pr-10 py-2 focus:outline-none focus:ring-1 hover:bg-gray-50 focus:ring-gray-300 cursor-pointer">
                               <option value="newest">ใหม่ล่าสุด</option>
                               <option value="oldest">เก่าที่สุด</option>
                           </select>
                           <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                        </div>
                    </header>
                    <main>
                        {approvedCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center min-h-[60vh]">
                                <FileX2 size={55} className="mb-5 text-gray-400" />
                                <p className="text-base font-semibold text-gray-700">ไม่พบคอร์สที่ค้นหา</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {approvedCourses.map(course => renderCourseCard(course))}
                            </div>
                        )}
                    </main>
                </>
            )}
        </div>
    );
};

export default Page;