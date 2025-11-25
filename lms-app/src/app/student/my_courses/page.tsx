'use client';

import React, { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ClockIcon, UserGroupIcon, ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, DocumentTextIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

// --- Interfaces ---
interface Course {
    id: number;
    title: string;
    description: string;
    duration: string;
    studentCount: number;
    imageUrl: string;
    isFavorited?: boolean;
}

interface Assignment {
    id: number;
    courseId: number;
    courseName: string;
    title: string;
    dueDate: Date;
    status: 'Submitted' | 'Pending';
    submissionDate?: Date;
    details: string[];
    briefUrl?: string;
    submittedFiles?: { name: string }[];
}

// --- Mock Data ---
const myCourses: Course[] = [
    { id: 1, title: 'Data Visualization', description: 'สอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูง สอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูงสอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูงสอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูงสอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูง', duration: '20 ชั่วโมง', studentCount: 30, imageUrl: '/images/50.png', isFavorited: true },
    { id: 2, title: 'Advanced UX/UI Design', description: 'เจาะลึกการออกแบบประสบการณ์ผู้ใช้สำหรับแอปพลิเคชัน', duration: '25 ชั่วโมง', studentCount: 25, imageUrl: '/images/50.png', isFavorited: false },
    { id: 3, title: 'Digital Marketing Fundamentals', description: 'เรียนรู้พื้นฐานการตลาดดิจิทัลครบวงจร', duration: '15 ชั่วโมง', studentCount: 50, imageUrl: '/images/50.png', isFavorited: true },
    { id: 4, title: 'The Complete Python Bootcamp', description: 'เริ่มต้นเขียนโปรแกรมด้วยภาษา Python', duration: '40 ชั่วโมง', studentCount: 120, imageUrl: '/images/50.png', isFavorited: false },
];

const initialAssignments: Assignment[] = [
    { id: 1, courseId: 1, courseName: 'Data Visualization', title: 'วิเคราะห์และนำเสนอข้อมูลด้วยแผนภูมิ', dueDate: new Date('2025-08-28T23:59:00'), status: 'Pending', details: ['เลือก Dataset ที่สนใจ', 'สร้าง Dashboard เพื่อนำเสนอ Insight', 'การทำงานกลุ่ม: กลุ่มละ 3-4 คน'], briefUrl: 'mid-term-brief.pdf' },
    { id: 2, courseId: 1, courseName: 'Data Visualization', title: 'วิเคราะห์และนำเสนอข้อมูลด้วยแผนภูมิ (ส่งแล้ว)', dueDate: new Date('2025-08-28T23:59:00'), status: 'Submitted', submissionDate: new Date('2025-08-21T16:30:00'), details: ['เลือก Dataset ที่สนใจ', 'สร้าง Dashboard เพื่อนำเสนอ Insight', 'การทำงานกลุ่ม: กลุ่มละ 3-4 คน'], briefUrl: 'mid-term-brief.pdf', submittedFiles: [{ name: '21_08_25 - [frontend] กิ่งฟ้า คล้ายสวน ( จิ๊บ ).docx' }] },
    { id: 3, courseId: 1, courseName: 'Data Visualization', title: 'Assignment 3', dueDate: new Date('2025-08-30T23:59:00'), status: 'Pending', details: ['Detail 1', 'Detail 2', 'การทำงานกลุ่ม: เดี่ยว'] },
    { id: 4, courseId: 1, courseName: 'Data Visualization', title: 'Assignment 4', dueDate: new Date('2025-08-18T23:59:00'), status: 'Pending', details: ['Detail A', 'การทำงานกลุ่ม: กลุ่ม 2 คน'] },
    { id: 5, courseId: 2, courseName: 'Advanced UX/UI Design', title: 'Final Project', dueDate: new Date('2025-08-22T23:59:00'), status: 'Pending', details: ['Final project details', 'การทำงานกลุ่ม: กลุ่ม 3-4 คน'] },
];

const getAssignmentStatusList = (assignment: Assignment, today: Date): { text: string; className: string } => {
    if (assignment.status === 'Submitted' && assignment.submissionDate) {
        if (assignment.submissionDate <= assignment.dueDate) {
            return { text: 'ส่งแล้ว', className: 'bg-green-500 text-center' };
        } else {
            return { text: 'ส่งเลยกำหนด', className: 'bg-yellow-500 text-center' };
        }
    } else {
        if (today > assignment.dueDate) {
            return { text: 'เลยกำหนด', className: 'bg-red-600 text-center' };
        } else {
            return { text: 'ยังไม่ได้ส่ง', className: 'bg-gray-500 text-center' };
        }
    }
};

const AssignmentDetailPage: React.FC<{
    assignment: Assignment;
    onBack: () => void;
    courseTitle: string;
    onUpdate: (assignmentId: number, updatedData: Partial<Assignment>) => void;
}> = ({ assignment, onBack, courseTitle, onUpdate }) => {
    const [userFiles, setUserFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getStatusBadge = () => {
        if (assignment.status === 'Submitted') {
            return { text: 'ส่งแล้ว', className: 'bg-green-100 text-green-800' };
        }
        return { text: 'ยังไม่ได้ส่ง', className: 'bg-gray-100 ' };
    };

    const statusBadge = getStatusBadge();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            if (newFiles.length > 0) {
                setUserFiles(prevFiles => [...prevFiles, ...newFiles]);
                toast.success(`แนบไฟล์เพิ่ม ${newFiles.length} ไฟล์`);
            }
            event.target.value = '';
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = (fileToRemove: File) => {
        setUserFiles(userFiles.filter(file => file !== fileToRemove));
        toast.error(`ลบไฟล์ ${fileToRemove.name} แล้ว`);
    };

    const handleSubmit = () => {
        if (userFiles.length === 0) {
            toast.error('กรุณาแนบไฟล์ก่อนส่งงาน');
            return;
        }
        const filesForUpdate = userFiles.map(file => ({ name: file.name }));

        onUpdate(assignment.id, {
            status: 'Submitted',
            submissionDate: new Date(),
            submittedFiles: filesForUpdate,
        });

        toast.success('ส่งงานเรียบร้อยแล้ว!');
    };

    const handleUnsubmit = () => {
        onUpdate(assignment.id, {
            status: 'Pending',
            submissionDate: undefined,
            submittedFiles: [],
        });
        
        toast.error('ยกเลิกการส่งงานแล้ว');
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
            
            <button onClick={onBack} className="flex cursor-pointer items-center gap-2 font-semibold hover:underline text-lg  transition-colors">
                <ArrowLeftIcon className="w-5 h-5 stroke-3" />
                กลับไปหน้า {courseTitle}
            </button>

            <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-semibold text-gray-900">{assignment.title}</h1>
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusBadge.className}`}>
                        {statusBadge.text}
                    </span>
                </div>
                <p className="text-sm text-gray-500">
                    กำหนดส่ง: {assignment.dueDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                </p>
                <hr />

                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-800">รายละเอียด</h2>
                    <div className="space-y-2 text-gray-700">
                        {assignment.details.map((detail, index) => <p key={index}>{detail}</p>)}
                    </div>
                </div>

                <div>
                    <h2 className="font-semibold text-gray-800 mb-2">เอกสารแนบ</h2>
                    {assignment.briefUrl ? (
                         <div className="border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <DocumentTextIcon className="w-6 h-6 text-gray-500"/>
                                 <span className="font-medium text-gray-700">{assignment.briefUrl}</span>
                             </div>
                         </div>
                    ) : <p className="text-gray-500">ไม่มีเอกสารแนบ</p>}
                </div>

                <div>
                    <h2 className="font-semibold text-gray-800 mb-3">งานของคุณ</h2>
                    <div className="border border-gray-300 rounded-lg p-4 space-y-4">
                        {assignment.status === 'Submitted' ? (
                            <>
                                {assignment.submittedFiles?.map((file, index) => (
                                     <div key={index} className="border border-gray-300 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                             <LinkIcon className="w-5 h-5 text-gray-600"/>
                                             <span className="font-medium text-gray-800 text-sm">{file.name}</span>
                                         </div>
                                     </div>
                                ))}
                                <button onClick={handleUnsubmit} className="w-full sm:w-auto bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">
                                    ยกเลิกการส่ง
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {userFiles.map((file, index) => (
                                    <div key={`${file.name}-${file.lastModified}-${index}`} className="border border-gray-300 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <LinkIcon className="w-5 h-5 text-gray-600 flex-shrink-0"/>
                                            <span className="font-medium text-gray-800 text-sm truncate" title={file.name}>
                                                {file.name}
                                            </span>
                                        </div>
                                        <button onClick={() => handleRemoveFile(file)} className="p-1 rounded-full hover:bg-gray-200">
                                            <XMarkIcon className="w-4 h-4 text-gray-600"/>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={handleAttachClick} className="w-full bg-blue-50 text-blue-700 font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-blue-200 hover:bg-blue-100 transition-colors">
                                    + แนบไฟล์
                                </button>
                                <button onClick={handleSubmit} className="w-full sm:w-auto bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors self-start disabled:bg-gray-300" disabled={userFiles.length === 0}>
                                    ส่งงาน
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CourseDetailPage: React.FC<{
    course: Course;
    assignments: Assignment[];
    onBack: () => void;
    onAssignmentSelect: (id: number) => void;
}> = ({ course, assignments, onBack, onAssignmentSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const assignmentsForCourse = assignments.filter(a => a.courseId === course.id);

    const calendarData = useMemo(() => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startDayOfWeek = startOfMonth.getDay();
        const daysInMonth = endOfMonth.getDate();
        const today = new Date();
        const calendarDays = [];

        for (let i = 0; i < startDayOfWeek; i++) { calendarDays.push({ key: `empty-start-${i}`, day: null }); }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isDueDate = assignmentsForCourse.some(a => a.dueDate.toDateString() === date.toDateString());
            const isToday = today.toDateString() === date.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            calendarDays.push({ key: day, day, date, isDueDate, isToday, isSelected });
        }

        let nextMonthDay = 1;
        while (calendarDays.length % 7 !== 0) {
            calendarDays.push({ key: `empty-end-${nextMonthDay}`, day: nextMonthDay, isNextMonth: true });
            nextMonthDay++;
        }
        return calendarDays;
    }, [currentMonth, selectedDate, assignmentsForCourse]);

    const assignmentsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return assignmentsForCourse.filter(a => a.dueDate.toDateString() === selectedDate.toDateString());
    }, [selectedDate, assignmentsForCourse]);

    return (
        <div className="space-y-8">
            <button onClick={onBack} className="flex items-center hover:underline cursor-pointer gap-2 font-semibold text-lg">
                <ArrowLeftIcon className="w-5 h-5 stroke-3" />
                กลับไปหน้ารวมคอร์ส
            </button>
            <div>
                
                <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300">
                    <div className="md:w-2/5 h-48 md:h-auto relative"><Image src={course.imageUrl} alt={course.title} layout="fill" objectFit="cover" /></div>
                    <div className="md:w-3/5 p-6 flex flex-col justify-center">
                        <h3 className="text-xl font-semibold text-gray-800">{course.title}</h3>
                        <p className="mt-2 text-sm text-black">{course.description}</p>
                        <div className="mt-4 flex flex-col space-y-2 text-sm">
                            <div className="flex items-center text-gray-600"><ClockIcon className="w-5 h-5 mr-2" /><span>{course.duration}</span></div>
                            <div className="flex items-center text-gray-600"><UserGroupIcon className="w-5 h-5 mr-2" /><span>{course.studentCount}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                
                <div className="bg-white rounded-xl shadow-lg border border-gray-300">
                    <div className="flex items-center justify-between p-4 bg-[#414E51]  rounded-t-xl text-white">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-white/20 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <h3 className="font-semibold text-lg">{currentMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h3>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-white/20 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-7 text-sm">
                        {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => (<div key={day} className="p-3 text-center font-semibold border-b border-r">{day}</div>))}
                        {calendarData.map(d => {
                             if (!d.day) return <div key={d.key} className="border-r border-b"></div>;
                             return (
                                 <div key={d.key} onClick={() => d.date && setSelectedDate(d.date)} className={`p-2 text-center border-r border-b h-20 flex justify-center pt-2 cursor-pointer transition-colors ${d.isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                     <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold
                                         ${d.isDueDate ? 'bg-blue-600 text-white' : ''}
                                         ${d.isToday ? 'border-2 border-gray-400' : ''}
                                         ${d.isNextMonth ? 'text-gray-400' : ''}
                                    `}>
                                         {d.day}
                                     </span>
                                 </div>
                             )
                        })}
                    </div>
                </div>
            </div>
            <div className=" mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">งานที่ได้รับมอบหมาย</h2>
                <hr className="mt-4 mb-6 border-t-2 border-gray-200" />
                {assignmentsForSelectedDate.length > 0 ? (
                    <div className="space-y-4">
                        {assignmentsForSelectedDate.map(assignment => {
                            const status = getAssignmentStatusList(assignment, new Date());
                            return (
                                <div key={assignment.id} className="bg-[#414E51]  text-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-lg">{assignment.courseName}</p>
                                        <p>{assignment.title}</p>
                                        <p className="text-xs text-gray-300 mt-1">Due {assignment.dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} {assignment.dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className={`w-full sm:w-auto text-white font-semibold py-2 px-4 rounded-full text-sm ${status.className}`}>{status.text}</span>
                                        <button onClick={() => onAssignmentSelect(assignment.id)} className="w-full sm:w-auto bg-white text-black font-semibold py-2 px-4 rounded-full text-sm hover:bg-gray-200 transition-colors">ดูรายละเอียดงาน</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : ( <div className="text-center py-10 bg-white rounded-xl shadow-lg border border-gray-300"><DocumentTextIcon className="w-12 h-12 mx-auto text-gray-400" /><p className="mt-2 text-sm text-gray-500 font-semibold">ไม่มีงานมอบหมายสำหรับวันที่เลือก</p></div> )}
            </div>
        </div>
    );
};


// --- CourseCard Component ---
const CourseCard: React.FC<{ course: Course; onCourseSelect: (id: number) => void }> = ({ course, onCourseSelect }) => {
    const [isFavorited, setIsFavorited] = useState(course.isFavorited || false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // หยุดไม่ให้ event click ลามไปถึง div แม่
        const newStatus = !isFavorited;
        setIsFavorited(newStatus);
        
        if (newStatus) {
            toast.success(`เพิ่ม '${course.title}' ในคอร์สโปรด`);
        } else {
            toast.error(`ลบ '${course.title}' ออกจากคอร์สโปรด`);
        }
    };

    return (
        <div onClick={() => onCourseSelect(course.id)} className="w-full text-left cursor-pointer group">
            <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300 cursor-pointer group transition-all duration-200 hover:shadow-xl">
                <div className="md:w-2/5 h-48 md:h-auto relative">
                    <Image src={course.imageUrl} alt={course.title} layout="fill" objectFit="cover" />
                </div>
                <div className="md:w-3/5 p-6 flex flex-col">
                    <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-black">{course.title}</h3>
                        <p className="mt-2 text-sm text-black line-clamp-2">{course.description}</p>
                        <div className="mt-4 flex flex-col space-y-2 text-sm">
                            <div className="flex items-center text-gray-600"><ClockIcon className="w-5 h-5 mr-2" /><span>{course.duration}</span></div>
                            <div className="flex items-center text-gray-600"><UserGroupIcon className="w-5 h-5 mr-2" /><span>{course.studentCount}</span></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleFavoriteClick}
                            className="flex items-center text-sm font-medium transition-colors text-gray-600"
                        >
                            {isFavorited ? (
                                <>
                                    <span>คอร์สโปรด</span>
                                    <HeartIconSolid className="ml-2 h-5 w-5 text-red-500" />
                                </>
                            ) : (
                                <>
                                    <span>เพิ่มลงคอร์สโปรด</span>
                                    <HeartIconOutline className="ml-2 h-5 w-5 text-gray-400 transition-colors hover:text-red-500" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Course List Page Component ---
const MyCoursesListPage: React.FC<{ onCourseSelect: (id: number) => void }> = ({ onCourseSelect }) => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-semibold text-black">คอร์สของฉัน</h1>
            <hr className="mt-[-10px] mb-8 border-t-2 border-gray-200" />
            <div className="space-y-6">
                {myCourses.map(course => (
                    <CourseCard key={course.id} course={course} onCourseSelect={onCourseSelect} />
                ))}
            </div>
        </div>
    );
};

// --- Main Controller Component ---
const CourseFlowController: React.FC = () => {
    const [assignmentsData, setAssignmentsData] = useState<Assignment[]>(initialAssignments);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

    const selectedCourse = myCourses.find(c => c.id === selectedCourseId) || null;
    const selectedAssignment = assignmentsData.find(a => a.id === selectedAssignmentId) || null;

    const handleUpdateAssignment = (assignmentId: number, updatedData: Partial<Assignment>) => {
        setAssignmentsData(prevAssignments =>
            prevAssignments.map(asm =>
                asm.id === assignmentId ? { ...asm, ...updatedData } : asm
            )
        );
    };

    const handleBackToCourseDetail = () => setSelectedAssignmentId(null);
    const handleBackToCourseList = () => setSelectedCourseId(null);

    return (
        <div className="min-h-screen  p-4 sm:p-8 font-sans">
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
            <div className="max-w-4xl mx-auto">
                {selectedAssignment && selectedCourse ? (
                    <AssignmentDetailPage
                        assignment={selectedAssignment}
                        onBack={handleBackToCourseDetail}
                        courseTitle={selectedCourse.title}
                        onUpdate={handleUpdateAssignment}
                    />
                ) : selectedCourse ? (
                    <CourseDetailPage
                        course={selectedCourse}
                        assignments={assignmentsData}
                        onBack={handleBackToCourseList}
                        onAssignmentSelect={(id) => setSelectedAssignmentId(id)}
                    />
                ) : (
                    <MyCoursesListPage onCourseSelect={(id) => setSelectedCourseId(id)} />
                )}
            </div>
        </div>
    );
};

export default CourseFlowController;