'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast, { Toaster } from 'react-hot-toast';

// Interface ไม่มีการเปลี่ยนแปลง
interface Course {
    id: number;
    title: string;
    description: string;
    duration: string;
    studentCount: number;
    imageUrl: string;
    isFavorited?: boolean;
}

// ข้อมูลเริ่มต้นยังคงเหมือนเดิม
const initialCourses: Course[] = [
    {
        id: 1,
        title: 'Data Visualization',
        description: 'สอนการวิเคราะห์ข้อมูลตั้งแต่พื้นฐานจนถึงขั้นสูง พร้อมใช้เครื่องมือสื่อสารทางธุรกิจอย่างมีประสิทธิภาพ',
        duration: '20 ชั่วโมง',
        studentCount: 30,
        imageUrl: '/images/50.png',
        isFavorited: true,
    },
    {
        id: 2,
        title: 'Advanced Python Programming',
        description: 'เจาะลึกการเขียน Python สำหรับงาน Data Science โดยเฉพาะ ตั้งแต่การจัดการข้อมูลไปจนถึงการสร้างโมเดล ',
        duration: '35 ชั่วโมง',
        studentCount: 25,
        imageUrl: '/images/50.png',
        isFavorited: true,
    },
];

interface CourseCardProps {
    course: Course;
    onUnfavorite: (id: number) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onUnfavorite }) => {
    const router = useRouter();

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUnfavorite(course.id);
        toast.error(`ลบ '${course.title}' ออกจากคอร์สโปรด`);
    };

    const handleCardClick = () => {
        router.push('/student/course-details');
    };

    return (
        <div
            onClick={handleCardClick}
            className="flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300 cursor-pointer group transition-all duration-200 hover:shadow-xl "
        >
            <div className="md:w-2/5 h-48 md:h-auto relative">
                <Image
                    src={course.imageUrl}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                />
            </div>
            <div className="md:w-3/5 p-6 flex flex-col">
                <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-black">{course.title}</h3>
                    <p className="mt-2 text-sm text-black line-clamp-2">
                        {course.description}
                    </p>
                    <div className="mt-4 flex flex-col space-y-2  text-sm text-gray-600">
                        <div className="flex items-center ">
                            <ClockIcon className="w-5 h-5 mr-2" />
                            <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center ">
                            <UserGroupIcon className="w-5 h-5 mr-2" />
                            <span>{course.studentCount} คน</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleFavoriteClick}
                        className="flex items-center text-sm font-medium transition-colors text-black"
                    >
                        <span>คอร์สโปรด</span>
                        <HeartIconSolid className="ml-2 h-5 w-5 cursor-pointer text-red-500" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const MyCoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>(initialCourses);

    const handleUnfavorite = (courseId: number) => {
        setCourses(currentCourses =>
            currentCourses.filter(course => course.id !== courseId)
        );
    };
    
    const favoriteCourses = courses.filter(course => course.isFavorited);

    return (
        <div className="min-h-screen p-4 sm:p-8 font-sans ">
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

            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl text-black font-semibold ">คอร์สโปรดของฉัน</h1>
                <hr className="mt-[-10px] mb-8 border-t-2 border-gray-200" />
                <div className="space-y-6">
                    {favoriteCourses.length > 0 ? (
                        favoriteCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onUnfavorite={handleUnfavorite}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 mt-8">คุณยังไม่มีคอร์สโปรด</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyCoursesPage;