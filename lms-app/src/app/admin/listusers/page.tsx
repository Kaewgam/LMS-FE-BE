'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MagnifyingGlassIcon, FunnelIcon, BarsArrowDownIcon, PencilIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast, { Toaster } from 'react-hot-toast';

// --- Interfaces ---
interface User {
    id: number;
    userId: string;
    name: string;
    role: 'ผู้เรียน' | 'ผู้สอน' | 'ผู้ดูแลสถาบัน';
    status: 'active' | 'suspended';
}

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

// --- Data Structure ---
const allCourseData = {
    'คอร์สทั้งหมด': {
        learner: {
            learningProgress: { total: 80, courseProgress: { 'คอร์ส Data Science 101': 87, 'คอร์ส UX/UI Design': 73 } },
            submissionProgress: { total: 75, courseProgress: { 'คอร์ส Data Science 101': 100, 'คอร์ส UX/UI Design': 50 } },
            scores: { total: 68, courseScores: { 'คอร์ส Data Science 101': '35/50', 'คอร์ส UX/UI Design': '20/30' } },
        },
        teacher: {
            workProgress: { total: 84, courseProgress: { 'คอร์ส Data Science 101': 100, 'คอร์ส UX/UI Design': 67 } },
        },
    },
    'คอร์ส Data Science 101': {
        learner: {
            learningProgress: { total: 87, lesson1: 100, lesson2: 60, testTaken: 100 },
            submissionProgress: { total: 100, lesson1: { required: true, status: 100 }, lesson2: { required: false, status: null } },
            scores: { testScore: { achieved: 35, totalPossible: 50 } },
        },
        teacher: {
            workProgress: { total: 100, lesson1: 100, lesson2: 100, testCreated: 100 },
        },
    },
    'คอร์ส UX/UI Design': {
        learner: {
            learningProgress: { total: 73, lesson1: 100, lesson2: 20, testTaken: 100 },
            submissionProgress: { total: 50, lesson1: { required: true, status: 100 }, lesson2: { required: true, status: 0 } },
            scores: { testScore: { achieved: 20, totalPossible: 30 } },
        },
        teacher: {
            workProgress: { total: 67, lesson1: 100, lesson2: 100, testCreated: 0 },
        },
    },
};

// --- Child Components ---

const PieChart: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                <circle className="text-black" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60"
                    strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-black">{`${Math.round(percentage)}%`}</span>
        </div>
    );
};

const UserDetailsModal: React.FC<{ user: User | null; onClose: () => void }> = ({ user, onClose }) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);

    const courseNames = ['คอร์สทั้งหมด', 'คอร์ส Data Science 101', 'คอร์ส UX/UI Design'];
    const [selectedCourse, setSelectedCourse] = useState(courseNames[0]);

    useEffect(() => { if (user) setSelectedCourse(courseNames[0]); }, [user?.id]);

    if (!user || !isClient) return null;

    const displayData = allCourseData[selectedCourse as keyof typeof allCourseData] || allCourseData['คอร์สทั้งหมด'];
    const systemStats = { firstLogin: '20 ส.ค. 2568', lastLogin: '20 ส.ค. 2568', loginCount: 10, avgTime: '3 ชั่วโมง' };

    const renderSection = (title: string, data: any) => (
        <div className="border-b border-gray-300 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-black mb-3">{title}</h3>
            <div className="flex items-center gap-6">
                <PieChart percentage={data.total} />
                <div className="text-black space-y-1">
                    <p className="font-semibold">ทั้งหมด: {Math.round(data.total)}%</p>
                    {selectedCourse === 'คอร์สทั้งหมด' && data.courseProgress && Object.entries(data.courseProgress).map(([name, progress]) => (<p key={name}>{name}: {progress as number}%</p>))}
                    {user.role === 'ผู้เรียน' && selectedCourse !== 'คอร์สทั้งหมด' && title.includes('เรียน') && (<>
                        {Object.entries(data).map(([key, value]) => key.startsWith('lesson') && <p key={key}>บทที่ {key.replace('lesson', '')}: {value as number}%</p>)}
                        {data.testTaken !== undefined && <p>ทำแบบทดสอบ: {data.testTaken}%</p>}
                    </>)}
                    {user.role === 'ผู้เรียน' && selectedCourse !== 'คอร์สทั้งหมด' && title.includes('ส่งงาน') && Object.entries(data).map(([key, value]) => {
                        const item = value as { required: boolean, status: number };
                        return key.startsWith('lesson') && item.required && <p key={key}>บทที่ {key.replace('lesson', '')}: {item.status}%</p>;
                    })}
                    {user.role === 'ผู้สอน' && selectedCourse !== 'คอร์สทั้งหมด' && (<>
                        {Object.entries(data).map(([key, value]) => key.startsWith('lesson') && <p key={key}>บทที่ {key.replace('lesson', '')}: {value as number}%</p>)}
                        {data.testCreated !== undefined && <p>สร้างแบบทดสอบ: {data.testCreated}%</p>}
                    </>)}
                </div>
            </div>
        </div>
    );

    const renderScoreSection = (title: string, data: any) => (
        <div className="border-b border-gray-300 pb-4 mb-4">
            <h3 className="text-lg font-semibold text-black mb-3">{title}</h3>
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                    <PieChart percentage={selectedCourse === 'คอร์สทั้งหมด' ? data.total : (data.testScore.achieved / data.testScore.totalPossible) * 100} />
                </div>
                <div className="text-black space-y-1">
                    {selectedCourse === 'คอร์สทั้งหมด' && data.courseScores && Object.entries(data.courseScores).map(([name, score]) => (<p key={name}>{name}: {score as string} คะแนน</p>))}
                    {selectedCourse !== 'คอร์สทั้งหมด' && data.testScore && <p className="font-semibold">คะแนนแบบทดสอบ: {data.testScore.achieved}/{data.testScore.totalPossible}</p>}
                </div>
            </div>
        </div>
    );

    const renderSystemStats = () => (
        <div>
            <h3 className="text-lg font-semibold text-black mb-4">สถิติการใช้งานระบบ</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-black text-sm">
                <span className="font-semibold">เข้าใช้งานครั้งแรก:</span><span>{systemStats.firstLogin}</span>
                <span className="font-semibold">เข้าใช้งานล่าสุด:</span><span>{systemStats.lastLogin}</span>
                <span className="font-semibold">จำนวนครั้งที่เข้าใช้งาน:</span><span>{systemStats.loginCount} ครั้ง</span>
                <span className="font-semibold">จำนวนชั่วโมงเฉลี่ยต่อสัปดาห์:</span><span>{systemStats.avgTime}</span>
            </div>
        </div>
    );

    const modalContent = (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b p-4">
                    <div className="flex items-center gap-4">
                        <img src="/images/40.png" alt="User Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                        <div>
                            <p className="text-xl font-semibold text-black">{user.name}</p>
                            <p className="text-sm text-black">{user.userId}</p>
                            <p className="text-sm text-black">{user.role}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {user.role !== 'ผู้ดูแลสถาบัน' && (
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
                            <h3 className="text-lg font-semibold text-black">{user.role === 'ผู้เรียน' ? 'ตรวจสอบการเข้าเรียน' : 'ตรวจสอบการเข้าสอน'}</h3>
                            <div className="relative">
                                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-gray-400">
                                    {courseNames.map(course => (<option key={course} value={course}>{course}</option>))}
                                </select>
                            </div>
                        </div>
                    )}
                    {user.role === 'ผู้เรียน' && (<>
                        {renderSection('ความคืบหน้าในการเรียน', displayData.learner.learningProgress)}
                        {renderSection('การส่งงาน', displayData.learner.submissionProgress)}
                        {renderScoreSection('คะแนน', displayData.learner.scores)}
                    </>)}
                    {user.role === 'ผู้สอน' && (<>
                        {renderSection('ความคืบหน้าในการดำเนินงาน', displayData.teacher.workProgress)}
                    </>)}
                    {renderSystemStats()}
                </div>
            </div>
        </div>
    );
    return ReactDOM.createPortal(modalContent, document.body);
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    const isDeleteAction = title.includes('ลบ');
    const confirmButtonColor = isDeleteAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
    return (
        <div className="fixed inset-0 flex justify-center items-center z-50 bg-opacity-40 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" /> {title}
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


// --- Main Page Component ---
const UserManagementPage: React.FC = () => {
    const initialUsers: User[] = [
        { id: 1, userId: '10000000111', name: 'คริสติน่า แช่แต้', role: 'ผู้ดูแลสถาบัน', status: 'active' },
        { id: 2, userId: '33000008888', name: 'แจ็ค จง', role: 'ผู้สอน', status: 'active' },
        { id: 3, userId: '45678901234', name: 'สมบัติ มีชัย', role: 'ผู้เรียน', status: 'suspended' },
        { id: 4, userId: '98765432109', name: 'มณีรัตน์ วงศ์ตระกูล', role: 'ผู้สอน', status: 'active' },
        { id: 5, userId: '11223344556', name: 'อนันต์ ชื่นชม', role: 'ผู้เรียน', status: 'active' },
    ];

    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
    const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
    const [filter, setFilter] = useState<'ทั้งหมด' | 'ผู้เรียน' | 'ผู้สอน' | 'ผู้ดูแลสถาบัน'>('ทั้งหมด');
    const [sort, setSort] = useState<'ล่าสุด' | 'ชื่อ (ก-ฮ)' | 'ชื่อ (ฮ-ก)'>('ล่าสุด');
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    };

    const filteredUsers = users.filter(user =>
        (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.userId.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filter === 'ทั้งหมด' || user.role === filter)
    );

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sort === 'ล่าสุด') return b.id - a.id;
        if (sort === 'ชื่อ (ก-ฮ)') return a.name.localeCompare(b.name, 'th', { sensitivity: 'base' });
        if (sort === 'ชื่อ (ฮ-ก)') return b.name.localeCompare(a.name, 'th', { sensitivity: 'base' });
        return 0;
    });

    const handleView = (userId: string) => {
        const userToView = users.find(u => u.userId === userId);
        if (userToView) setSelectedUser(userToView);
    };

    const handleDelete = (userId: string) => {
        const user = users.find(u => u.userId === userId);
        if (!user) return;
        openConfirmationModal('ยืนยันการลบผู้ใช้', `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ " ${user.name} " ( รหัสผู้ใช้ : ${userId} ) การกระทำนี้ไม่สามารถย้อนกลับได้`, () => {
            setUsers(users.filter((u) => u.userId !== userId));
            toast.success(`ลบผู้ใช้ " ${user.name} " เรียบร้อยแล้ว`);
            closeConfirmationModal();
        });
    };

    const handleSuspend = (userId: string) => {
        const user = users.find(u => u.userId === userId);
        if (!user) return;
        const isSuspending = user.status === 'active';
        const actionText = isSuspending ? 'ระงับการใช้งาน' : 'กู้คืนการใช้งาน';
        openConfirmationModal(`ยืนยัน${actionText}`, `คุณแน่ใจหรือไม่ว่าต้องการ${actionText}ผู้ใช้ " ${user.name} " ( รหัสผู้ใช้ : ${userId} ) `, () => {
            setUsers(users.map((u) => u.userId === userId ? { ...u, status: isSuspending ? 'suspended' : 'active' } : u));
            const toastMessage = isSuspending ? `ผู้ใช้งาน "${user.name}" ถูกระงับ` : `ผู้ใช้งาน "${user.name}" ถูกยกเลิกการระงับ`;
            if (isSuspending) { toast.error(toastMessage); } else { toast.success(toastMessage); }
            closeConfirmationModal();
        });
    };

    const renderCardButtons = (user: User) => (
        <div className="flex justify-end gap-2 text-right">
            <button onClick={() => handleView(user.userId)} className="flex items-center gap-1 hover:text-black transition-colors duration-150 cursor-pointer" title="ตรวจสอบ"><PencilIcon className="w-4 h-4" /><span>ตรวจสอบ</span></button>
            <button onClick={() => handleDelete(user.userId)} className="flex items-center gap-1 hover:text-black transition-colors duration-150 cursor-pointer" title="ลบ"><TrashIcon className="w-4 h-4" /><span>ลบ</span></button>
            <button onClick={() => handleSuspend(user.userId)} className={`flex items-center gap-1 transition-colors duration-150 cursor-pointer ${user.status === 'active' ? ' hover:text-black' : 'text-red-600 '}`} title={user.status === 'active' ? 'ระงับ' : 'กู้คืน'}>
                {user.status === 'active' ? (<><NoSymbolIcon className="w-4 h-4" /><span>ระงับ</span></>) : (<><CheckCircleIcon className="w-4 h-4" /><span>กู้คืน</span></>)}
            </button>
        </div>
    );

    return (
        <div className=" min-h-screen p-4 sm:p-8 font-sans antialiased">
            {/* --- โค้ด Toaster แบบดั้งเดิม --- */}
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
            
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={closeConfirmationModal} onConfirm={confirmationModal.onConfirm} title={confirmationModal.title} message={confirmationModal.message} />
            {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}

            <div className="max-w-7xl mx-auto space-y-8">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">รายชื่อผู้ใช้งานทั้งหมด</h1>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-grow">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสผู้ใช้..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all duration-200" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                                <FunnelIcon className="w-5 h-5 text-gray-500" /> <span className="font-medium">ตัวกรอง : <span>{filter}</span></span>
                            </button>
                            {showFilterDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 animate-fade-in">
                                    {['ทั้งหมด', 'ผู้เรียน', 'ผู้สอน', 'ผู้ดูแลสถาบัน'].map(option => (
                                        <button key={option} onClick={() => { setFilter(option as any); setShowFilterDropdown(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 cursor-pointer ${filter === option ? 'bg-gray-100 font-semibold text-black' : ''}`}>{option}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                                <BarsArrowDownIcon className="w-5 h-5 text-gray-500" /> <span className="font-medium">เรียงลำดับ : <span>{sort}</span></span>
                            </button>
                            {showSortDropdown && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 animate-fade-in">
                                    {['ล่าสุด', 'ชื่อ (ก-ฮ)', 'ชื่อ (ฮ-ก)'].map(option => (
                                        <button key={option} onClick={() => { setSort(option as any); setShowSortDropdown(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 cursor-pointer ${sort === option ? 'bg-gray-100 font-semibold text-black' : ''}`}>{option}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-300">
                    <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">#</th>
                                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">รหัสผู้ใช้</th>
                                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">ชื่อ</th>
                                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider border-r border-gray-300">บทบาท</th>
                                <th className="px-4 py-3 text-center text-[14px] font-semibold uppercase tracking-wider">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedUsers.length > 0 ? (
                                sortedUsers.map((user, index) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors duration-150 ${user.status === 'suspended' ? 'text-red-600' : ''}`}>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">{index + 1}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">{user.userId}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">{user.name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm border-r border-gray-300">{user.role}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm ">
                                            <div className="flex items-center justify-center gap-6">
                                                <button onClick={() => handleView(user.userId)} className={`flex items-center gap-1 transition-colors duration-150 cursor-pointer ${user.status === 'suspended' ? 'text-red-600' : 'text-black'}`} title="ตรวจสอบ"><PencilIcon className="w-4 h-4" /><span>ตรวจสอบ</span></button>
                                                <div className="w-px h-6 bg-gray-300"></div>
                                                <button onClick={() => handleDelete(user.userId)} className={`flex items-center gap-1 transition-colors duration-150 cursor-pointer ${user.status === 'suspended' ? 'text-red-600' : 'text-black'}`} title="ลบ"><TrashIcon className="w-4 h-4" /><span>ลบ</span></button>
                                                <div className="w-px h-6 bg-gray-300"></div>
                                                <button onClick={() => handleSuspend(user.userId)} className={`flex items-center gap-1 transition-colors duration-150 cursor-pointer ${user.status === 'active' ? 'text-black' : 'text-red-600 '}`} title={user.status === 'active' ? 'ระงับ' : 'กู้คืน'}>
                                                    {user.status === 'active' ? (<><NoSymbolIcon className="w-4 h-4" /><span>ระงับ</span></>) : (<><CheckCircleIcon className="w-4 h-4" /><span>กู้คืน</span></>)}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-lg">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden flex flex-col gap-4">
                    {sortedUsers.length > 0 ? (
                        sortedUsers.map((user, index) => (
                            <div key={user.id} className={`bg-white rounded-lg shadow-md p-4 space-y-2 border ${user.status === 'suspended' ? 'border-red-400' : 'border-gray-300'}`}>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                                    <div className="font-semibold text-lg ">{user.name}</div>
                                    <div className=" text-[13px] "><span className="font-semibold text-sm ">รหัสผู้ใช้ :</span> {user.userId}</div>
                                </div>
                                <div className="text-sm ">
                                    <div className="grid grid-cols-2 gap-y-1">
                                        <div className=" text-[13px]" ><span className="font-semibold ">ลำดับ :</span> {index + 1}</div>
                                        <div className="col-span-2"><span className="font-semibold ">บทบาท :</span> {user.role}</div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-300 flex justify-end gap-3 mt-4">
                                    {renderCardButtons(user)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center text-lg">ไม่พบข้อมูลผู้ใช้งาน</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;