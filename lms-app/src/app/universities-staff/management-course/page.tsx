'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// =======================
// Types
// =======================

type ApprovalStatus = "pending" | "active" | "denied" | "archived" | string;

interface ApprovalCourse {
  id: string;
  courseName: string;
  submissionDate: string;
  submitter: string;
  status: ApprovalStatus;
}

// map ค่า status backend → label ภาษาไทย
const STATUS_LABELS_TH: Record<string, string> = {
  pending: "รออนุมัติ",
  active: "อนุมัติแล้ว",
  denied: "ไม่อนุมัติ",
  archived: "เก็บถาวร",
};

function formatThaiDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// =======================
// ConfirmationModal Component
// =======================

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    decision: 'approve' | 'reject' | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, decision }) => {
    if (!isOpen) {
        return null;
    }

    const confirmButtonColor = decision === 'reject'
        ? 'bg-red-600 hover:bg-red-700'
        : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 border">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaExclamationTriangle className="text-yellow-500" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <FaTimes />
                    </button>
                </div>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor}`}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
};

// =======================
// Main Page Component
// =======================

const CourseManagementPage = () => {
    const router = useRouter();

    // --- State หลักจาก API ---
    const [courses, setCourses] = useState<ApprovalCourse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    // --- combobox เลือกคอร์สไปแก้ไข/ลบ ---
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchableSelectQuery, setSearchableSelectQuery] = useState('');
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const comboboxRef = useRef<HTMLDivElement>(null);

    // --- filter + search สำหรับตารางอนุมัติ ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ทั้งหมด');

    // --- modal state ---
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        courseId: string | null;
        decision: 'approve' | 'reject' | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        courseId: null,
        decision: null,
        title: '',
        message: '',
    });

    // =======================
    // Fetch จาก API
    // =======================

    useEffect(() => {
        let cancelled = false;

        async function fetchCourses() {
            try {
                setIsLoading(true);
                setLoadError(null);

                const params: Record<string, string> = {};
                const uniEnv =
                    process.env.NEXT_PUBLIC_UNIVERSITY_ID ||
                    process.env.NEXT_PUBLIC_UNIVERSITY_UUID ||
                    '';

                if (uniEnv) {
                    params.university_id = uniEnv;
                }

                const res = await api.get('/api/courses/', { params });

                const raw = Array.isArray(res.data)
                    ? res.data
                    : res.data?.results ?? [];

                if (cancelled) return;

                const mapped: ApprovalCourse[] = raw.map((course: any) => ({
                    id: String(course.id),
                    courseName: course.title ?? '-',
                    submissionDate: formatThaiDate(
                        course.created_at ?? course.createdAt
                    ),
                    submitter:
                        course.instructor_name ??
                        course.instructor_full_name ??
                        course.instructor?.full_name ??
                        '-',
                    status: (course.status ?? '').toLowerCase() as ApprovalStatus,
                }));

                setCourses(mapped);
            } catch (err: any) {
                console.error('[CourseManagement] fetch error:', err);
                if (!cancelled) {
                    const detail =
                        err?.response?.data?.detail ??
                        'ไม่สามารถดึงข้อมูลคอร์สได้ กรุณาลองใหม่อีกครั้ง';
                    setLoadError(detail);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        fetchCourses();

        return () => {
            cancelled = true;
        };
    }, []);

    // =======================
    // Hooks: ปิด combobox เมื่อคลิกข้างนอก
    // =======================

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

    // =======================
    // Derived data
    // =======================

    // Filter for combobox
    const comboboxFilteredCourses = useMemo(() => {
        const query = searchableSelectQuery.toLowerCase().trim();
        if (!query) {
            return courses;
        }
        return courses.filter(course =>
            course.courseName.toLowerCase().includes(query)
        );
    }, [courses, searchableSelectQuery]);

    // Filter for main table
    const filteredCourses = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const statusMap: Record<string, ApprovalStatus | 'ALL'> = {
            'ทั้งหมด': 'ALL',
            'รออนุมัติ': 'pending',
            'อนุมัติแล้ว': 'active',
            'ไม่อนุมัติ': 'denied',
        };
        const filterValue = statusMap[filterStatus] ?? 'ALL';

        return courses
            .filter(course => filterValue === 'ALL' || course.status === filterValue)
            .filter(course => {
                if (!query) return true;
                const courseName = course.courseName.toLowerCase();
                const submitter = course.submitter.toLowerCase();
                return courseName.includes(query) || submitter.includes(query);
            });
    }, [courses, searchQuery, filterStatus]);

    // =======================
    // Handlers
    // =======================

    const handleOpenModal = (id: string, decision: 'approve' | 'reject') => {
        setModalState({
            isOpen: true,
            courseId: id,
            decision: decision,
            title: decision === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการไม่อนุมัติ',
            message: `คุณแน่ใจหรือไม่ว่าต้องการ${decision === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คอร์สนี้?`,
        });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, courseId: null, decision: null, title: '', message: '' });
    };

    const handleConfirm = async () => {
        if (!modalState.courseId || !modalState.decision) return;

        const newStatus = modalState.decision === 'approve' ? 'active' : 'denied';
        const toastId = toast.loading('กำลังอัปเดตสถานะคอร์ส...');

        try {
            await api.patch(
                `/api/courses/${modalState.courseId}/update-status/`,
                { status: newStatus },
                {
                    params: {
                        university_id: process.env.NEXT_PUBLIC_UNIVERSITY_ID || ''
                    }
                }
            );

            // อัปเดต local state
            setCourses(courses.map(course =>
                course.id === modalState.courseId
                    ? { ...course, status: newStatus as ApprovalStatus }
                    : course
            ));

            toast.success('อัปเดตสถานะคอร์สสำเร็จ!', { id: toastId });
            handleCloseModal();
        } catch (err: any) {
            console.error('[CourseManagement] update status error:', err);
            const msg = err?.response?.data?.detail || 'ไม่สามารถอัปเดตสถานะได้';
            toast.error(msg, { id: toastId });
        }
    };

    const handleCreateCourse = () => {
        router.push('/universities-staff/add-course');
    };

    // =======================
    // Render Functions
    // =======================

    const renderStatus = (course: ApprovalCourse) => {
        const status = (course.status ?? '').toLowerCase();
        const label = STATUS_LABELS_TH[status] ?? status;

        switch (status) {
            case 'active':
                return <span className="font-semibold text-cyan-500">{label}</span>;
            case 'denied':
                return <span className="font-semibold text-red-500">{label}</span>;
            case 'pending':
                return (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => handleOpenModal(course.id, 'approve')}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded text-xs transition-colors"
                        >
                            อนุมัติ
                        </button>
                        <button
                            onClick={() => handleOpenModal(course.id, 'reject')}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded text-xs transition-colors"
                        >
                            ไม่อนุมัติ
                        </button>
                    </div>
                );
            default:
                return <span className="font-semibold text-gray-500">{label}</span>;
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirm}
                title={modalState.title}
                message={modalState.message}
                decision={modalState.decision}
            />

            <div className="min-h-screen p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-semibold mb-6">การจัดการคอร์ส</h1>

                    {/* Manage Course Section */}
                    <div className="bg-[#414E51] p-4 sm:p-8 rounded-xl shadow-lg mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">จัดการคอร์ส</h2>
                        <div>
                            <div className="flex flex-col sm:flex-row items-stretch bg-white rounded-lg mb-4">
                                <span className="rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none py-3 px-4 font-semibold text-sm border-b sm:border-b-0 sm:border-r border-gray-200 whitespace-nowrap bg-gray-50 sm:bg-transparent flex items-center">
                                    คอร์สที่ต้องการแก้ไข/ลบ
                                </span>
                                <div className="relative flex-grow" ref={comboboxRef}>
                                    <input
                                        type="text"
                                        value={searchableSelectQuery}
                                        onChange={(e) => {
                                            setSearchableSelectQuery(e.target.value);
                                            setSelectedCourse('');
                                            if (!isOptionsOpen) {
                                                setIsOptionsOpen(true);
                                            }
                                        }}
                                        onFocus={() => setIsOptionsOpen(true)}
                                        placeholder="ค้นหาหรือเลือกชื่อคอร์ส..."
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
                                            {comboboxFilteredCourses.length > 0 ? (
                                                comboboxFilteredCourses.map(course => (
                                                    <li
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourse(course.id);
                                                            setSearchableSelectQuery(course.courseName);
                                                            setIsOptionsOpen(false);
                                                            router.push(`/universities-staff/edit-course?id=${course.id}`);
                                                        }}
                                                        className="p-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        {course.courseName}
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-3 text-sm text-gray-500">ไม่พบคอร์ส</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleCreateCourse}
                                className="w-full sm:w-auto bg-white text-sm font-semibold py-3 px-8 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                สร้างคอร์ส
                            </button>
                        </div>
                    </div>

                    {/* Approve Course Section */}
                    <div className="bg-[#414E51] p-4 sm:p-8 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-white mb-4">อนุมัติคอร์ส</h2>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4 bg-[#57676b] rounded-lg">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ค้นหาจากชื่อคอร์ส หรือ ผู้ยื่นขออนุมัติ..."
                                    className="p-3 pl-10 w-full border border-gray-500 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="p-3 pr-10 border border-gray-500 rounded-lg text-sm w-full sm:w-48 appearance-none bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="ทั้งหมด">สถานะทั้งหมด</option>
                                    <option value="รออนุมัติ">รออนุมัติ</option>
                                    <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                                    <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
                                </select>
                                <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                            </div>
                        </div>

                        {/* Loading / Error State */}
                        {isLoading && (
                            <div className="text-center text-white py-10">
                                กำลังโหลดข้อมูล...
                            </div>
                        )}

                        {loadError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 rounded-lg p-4 mb-4">
                                ⚠️ {loadError}
                            </div>
                        )}

                        {/* --- Table for Desktop --- */}
                        {!isLoading && !loadError && (
                            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-600">
                                <table className="w-full min-w-max bg-white text-gray-800 text-center">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 font-semibold text-md border-r">ชื่อคอร์ส</th>
                                            <th className="p-3 font-semibold text-md border-r">วันที่ยื่นขออนุมัติ</th>
                                            <th className="p-3 font-semibold text-md border-r">ผู้ยื่นขออนุมัติ</th>
                                            <th className="p-3 font-semibold text-md">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => (
                                                <tr key={course.id} className="border-t border-gray-200">
                                                    <td className="p-3 border-r text-sm">{course.courseName}</td>
                                                    <td className="p-3 border-r text-sm">{course.submissionDate}</td>
                                                    <td className="p-3 border-r text-sm">{course.submitter}</td>
                                                    <td className="p-3 text-sm">{renderStatus(course)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center text-gray-400 p-6">
                                                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* --- Cards for Mobile --- */}
                        {!isLoading && !loadError && (
                            <div className="md:hidden space-y-4">
                                {filteredCourses.length > 0 ? (
                                    filteredCourses.map((course) => (
                                        <div key={course.id} className="bg-white rounded-lg p-4 text-sm space-y-3 shadow">
                                            <div className="flex justify-between items-start text-base">
                                                <span className="font-semibold text-gray-800 break-all pr-2">{course.courseName}</span>
                                            </div>
                                            <div className="border-t border-gray-100 pt-3 space-y-1">
                                                <div className="flex items-center gap-2"><span>ผู้ยื่นขอ :</span> <span className="font-medium">{course.submitter}</span></div>
                                                <div className="flex items-center gap-2"><span>วันที่ยื่น :</span> <span className="font-medium">{course.submissionDate}</span></div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-600">สถานะ :</span>
                                                    <div className="scale-90">{renderStatus(course)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 p-6 bg-gray-700 rounded-lg">
                                        ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseManagementPage;