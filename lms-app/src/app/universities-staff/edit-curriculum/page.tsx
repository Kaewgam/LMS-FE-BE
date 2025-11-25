'use client';

import React, { useState, useMemo, useRef, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaPlus, FaChevronDown, FaTrash, FaExclamationTriangle, FaTimes, FaPen, FaSave, FaSearch } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

// --- Interfaces ---
interface Option {
    value: string | number;
    label: string;
}
interface CourseOption {
    id: string;
    name: string;
}
interface Course {
    key: number;
    id: string;
    name: string;
}

// --- Mock Data ---
const allCoursesData: CourseOption[] = [
    { id: 'CS101', name: 'วิทยาการคอมพิวเตอร์เบื้องต้น' },
    { id: 'WD202', name: 'การพัฒนาเว็บขั้นสูงด้วย MERN Stack' },
    { id: 'UX301', name: 'หลักการออกแบบ UX/UI สำหรับแอปพลิเคชัน' },
    { id: 'DM405', name: 'กลยุทธ์การตลาดดิจิทัล' },
    { id: 'DA550', name: 'การวิเคราะห์ข้อมูลด้วย Python และ Pandas' },
    { id: 'BE100', name: 'ความรู้เบื้องต้นเกี่ยวกับธุรกิจออนไลน์' },
    { id: 'GD210', name: 'การออกแบบกราฟิกสำหรับสื่อดิจิทัล' },
];

const mockSyllabusData: { [key: string]: any } = {
    '1': {
        id: '1',
        name: 'การออกแบบนวัตกรรมดิจิทัลและผลิตภัณฑ์ (Digital Innovation & Product Design)',
        objectives: 'เพื่อสร้างนักออกแบบผลิตภัณฑ์ดิจิทัลที่มีความเข้าใจในนวัตกรรมและเทคโนโลยี',
        structureAndContent: 'เรียนรู้กระบวนการ Design Thinking, การทำ Prototype, และการทดสอบกับผู้ใช้จริง',
        evaluation: 'วัดผลจากชิ้นงานโปรเจกต์กลุ่ม และการนำเสนอแนวคิด',
        enabled: true,
        courses: [
            { key: 1, id: 'UX301', name: 'หลักการออกแบบ UX/UI สำหรับแอปพลิเคชัน' },
            { key: 2, id: 'GD210', name: 'การออกแบบกราฟิกสำหรับสื่อดิจิทัล' },
        ]
    },
    '2': {
        id: '2',
        name: 'ข้อมูล เทคโนโลยี และกลยุทธ์ธุรกิจ (Data, Technology & Business Strategy)',
        objectives: 'เพื่อสร้างผู้เชี่ยวชาญที่สามารถนำข้อมูลและเทคโนโลยีมาประยุกต์ใช้กับกลยุทธ์ธุรกิจได้',
        structureAndContent: 'ครอบคลุมเนื้อหาด้าน Business Intelligence, Data-driven Marketing, และ Digital Transformation',
        evaluation: 'วัดผลจากการวิเคราะห์กรณีศึกษา และการสอบข้อเขียน',
        enabled: false,
        courses: [
            { key: 1, id: 'DA550', name: 'การวิเคราะห์ข้อมูลด้วย Python และ Pandas' },
            { key: 2, id: 'DM405', name: 'กลยุทธ์การตลาดดิจิทัล' },
        ]
    }
};

// --- Sub-Component: Combobox (REVISED) ---
interface ComboboxProps {
    label: string;
    options: Option[];
    selectedValue: Option | null;
    onChange: (value: Option | null) => void;
    placeholder?: string;
    isRequired?: boolean;
    disabled?: boolean;
}
const Combobox: React.FC<ComboboxProps> = ({ label, options, selectedValue, onChange, placeholder, isRequired, disabled }) => {
    const [searchQuery, setSearchQuery] = useState(selectedValue ? selectedValue.label : '');
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // --- ADDED: To check if user has typed ---
    const comboboxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchQuery(selectedValue ? selectedValue.label : '');
        setIsDirty(false); // --- ADDED: Reset dirty state on new selection ---
    }, [selectedValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsOptionsOpen(false);
                setIsDirty(false); // Reset on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const filteredOptions = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        // --- REVISED: Only filter if the user has actually started typing ---
        if (!isDirty || !query) {
            return options;
        }
        return options.filter(option => option.label.toLowerCase().includes(query));
    }, [searchQuery, options, isDirty]);

    return (
        <div className="relative" ref={comboboxRef}>
            <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDirty(true); // --- ADDED: Mark as dirty because user is typing ---
                    onChange(null);
                    if (!isOptionsOpen) setIsOptionsOpen(true);
                }}
                onFocus={() => setIsOptionsOpen(true)}
                className="w-full p-3 pr-10 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required={isRequired && !selectedValue}
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => !disabled && setIsOptionsOpen(!isOptionsOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                disabled={disabled}
            >
                <FaChevronDown />
            </button>
            {isOptionsOpen && !disabled && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <li
                                key={option.value}
                                onClick={() => {
                                    onChange(option);
                                    setSearchQuery(option.label);
                                    setIsOptionsOpen(false);
                                    setIsDirty(false); // --- ADDED: Reset dirty state on selection ---
                                }}
                                className="p-3 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer"
                            >
                                {option.label}
                            </li>
                        ))
                    ) : (
                        <li className="p-3 text-sm text-gray-500">ไม่พบข้อมูล</li>
                    )}
                </ul>
            )}
        </div>
    );
};

// --- Sub-Component: ConfirmationModal ---
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
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        ยกเลิก
                    </button>
                    <button onClick={onConfirm} className={`py-2 px-4 text-white rounded-lg font-semibold transition-colors ${confirmButtonColor}`}>
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
};


// +++ Main Component: EditSyllabusPage +++
const EditSyllabusPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const formRef = useRef<HTMLFormElement>(null);

    // State for View/Edit mode
    const [isEditing, setIsEditing] = useState(false);
    
    // States for form fields
    const [syllabusName, setSyllabusName] = useState('');
    const [objectives, setObjectives] = useState('');
    const [structureAndContent, setStructureAndContent] = useState('');
    const [evaluation, setEvaluation] = useState('');
    const [enabled, setEnabled] = useState(true);

    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<Option | null>(null);
    const [selectedCourseName, setSelectedCourseName] = useState<Option | null>(null);
    const [nextCourseKey, setNextCourseKey] = useState(1);

    // States for filtering courses
    const [filterId, setFilterId] = useState('');
    const [filterName, setFilterName] = useState('');
    
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; }>({
        isOpen: false, title: '', message: '', onConfirm: () => {},
    });

    // --- Load Data on Component Mount ---
    useEffect(() => {
        const syllabusId = searchParams.get('id');
        const data = syllabusId ? mockSyllabusData[syllabusId] : undefined;

        if (data) {
            setSyllabusName(data.name);
            setObjectives(data.objectives);
            setStructureAndContent(data.structureAndContent);
            setEvaluation(data.evaluation);
            setEnabled(data.enabled);
            setCourses(data.courses);
            setNextCourseKey(data.courses.length + 1);
        } else if (syllabusId) {
            toast.error("ไม่พบข้อมูลหลักสูตร");
            router.push('/universities-staff/management-curriculum');
        }
    }, [searchParams, router]);

    // --- Handlers for courses ---
    const courseIdOptions = useMemo(() => {
        const addedCourseIds = new Set(courses.map(c => c.id));
        return allCoursesData.filter(course => !addedCourseIds.has(course.id)).map(course => ({ value: course.id, label: course.id }));
    }, [courses]);

    const courseNameOptions = useMemo(() => {
        const addedCourseNames = new Set(courses.map(c => c.name));
        return allCoursesData.filter(course => !addedCourseNames.has(course.name)).map(course => ({ value: course.name, label: course.name }));
    }, [courses]);

    // Filtering logic for the courses table
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            const idMatch = course.id.toLowerCase().includes(filterId.toLowerCase());
            const nameMatch = course.name.toLowerCase().includes(filterName.toLowerCase());
            return idMatch && nameMatch;
        });
    }, [courses, filterId, filterName]);


    const handleSelectCourseId = (option: Option | null) => {
        setSelectedCourseId(option);
        if (option) {
            const matchedCourse = allCoursesData.find(c => c.id === option.value);
            setSelectedCourseName(matchedCourse ? { value: matchedCourse.name, label: matchedCourse.name } : null);
        } else {
            setSelectedCourseName(null);
        }
    };

    const handleSelectCourseName = (option: Option | null) => {
        setSelectedCourseName(option);
        if (option) {
            const matchedCourse = allCoursesData.find(c => c.name === option.value);
            setSelectedCourseId(matchedCourse ? { value: matchedCourse.id, label: matchedCourse.id } : null);
        } else {
            setSelectedCourseId(null);
        }
    };

    const handleAddCourse = () => {
        const courseId = selectedCourseId?.label.trim();
        const courseName = selectedCourseName?.label.trim();
        if (courseId && courseName) {
            if (courses.some(course => course.id === courseId)) {
                toast.error(`คอร์ส ID: ${courseId} ถูกเพิ่มไปแล้ว`);
                return;
            }
            const isValidCourse = allCoursesData.some(c => c.id === courseId && c.name === courseName);
            if (!isValidCourse) {
                toast.error('ID และชื่อคอร์สไม่ตรงกัน');
                return;
            }
            setCourses([...courses, { key: nextCourseKey, id: courseId, name: courseName }]);
            setNextCourseKey(nextCourseKey + 1);
            setSelectedCourseId(null);
            setSelectedCourseName(null);
            toast.success(`เพิ่มคอร์ส "${courseName}" สำเร็จ`);
        } else {
            toast.error('กรุณาเลือก ID และชื่อคอร์สให้ถูกต้อง');
        }
    };
    
    const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleConfirmDeleteCourse = (keyToDelete: number, courseName: string) => {
        openConfirmationModal(
            'ยืนยันการลบคอร์ส',
            `คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "${courseName}" ออกจากหลักสูตรนี้?`,
            () => {
                setCourses(courses.filter(course => course.key !== keyToDelete));
                closeConfirmationModal();
                toast.success(`ลบคอร์ส "${courseName}" เรียบร้อยแล้ว`);
            }
        );
    };

    // --- Handlers for Edit/Save/Delete Syllabus ---
    const handleEditSaveToggle = () => {
        if (isEditing) {
            formRef.current?.requestSubmit();
        } else {
            setIsEditing(true);
            toast('คุณอยู่ในโหมดแก้ไข', { icon: '✍️' });
        }
    };

    const handleDeleteSyllabus = () => {
        openConfirmationModal(
            'ยืนยันการลบหลักสูตร',
            `คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร "${syllabusName}"? การกระทำนี้ไม่สามารถย้อนกลับได้`,
            () => {
                const toastId = toast.loading('กำลังลบหลักสูตร...');
                console.log(`🗑️ Deleting syllabus with ID: ${searchParams.get('id')}`);
                setTimeout(() => {
                    toast.success('ลบหลักสูตรสำเร็จแล้ว', { id: toastId });
                    setTimeout(() => {
                        router.push('/universities-staff/management-curriculum');
                    }, 1500);
                }, 1200);
            }
        );
    };
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault(); 
        const updatedData = {
            id: searchParams.get('id'), syllabusName, objectives, structureAndContent, evaluation, courses, enabled,
        };
        console.log("✅ Data Updated:", updatedData);
        toast.success('อัปเดตข้อมูลสำเร็จ!');
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-white">
            <Toaster position="top-center" reverseOrder={false} toastOptions={{
                style: { borderRadius: '8px', fontSize: '16px', padding: '16px 24px', fontWeight: '600' },
                success: { style: { background: '#F0FDF4', color: 'black' } },
                error: { style: { background: '#FFF1F2', color: 'black' } },
                loading: { style: { background: '#EFF6FF', color: 'black' } }
            }} />
            <ConfirmationModal {...confirmationModal} onClose={closeConfirmationModal} />

            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-2xl font-semibold">แก้ไขหลักสูตร</h1>
                    <div className="flex justify-end mt-4 gap-3">
                        <button
                            type="button"
                            onClick={handleEditSaveToggle}
                            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-colors ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-[#414e51] hover:bg-[#2b3436]'}`}
                        >
                            {isEditing ? <><FaSave /> บันทึกการแก้ไข</> : <><FaPen /> แก้ไขหลักสูตร</>}
                        </button>
                         <button
                            type="button"
                            onClick={handleDeleteSyllabus}
                            disabled={!isEditing}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <FaTrash /> ลบหลักสูตร
                        </button>
                    </div>
                </div>

                <div className="bg-[#414E51] rounded-xl shadow-lg p-6 sm:p-8">
                    <form ref={formRef} onSubmit={handleSubmit} id="edit-syllabus-form" className="space-y-8">
                        <div className="flex justify-end">
                            <div
                                className={`relative flex items-center p-1.5 rounded-full transition-colors duration-200 ease-in-out w-[215px] h-[48px] justify-between ${
                                    !isEditing 
                                        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                                        : (enabled ? 'bg-white cursor-pointer' : 'bg-gray-200 cursor-pointer')
                                }`}
                                onClick={() => isEditing && setEnabled(!enabled)}
                            >
                                <span className=" font-semibold ml-2 select-none ">เปิดใช้งานหลักสูตร</span>
                                <div className={`relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out ${enabled ? 'bg-green-500' : 'bg-gray-500'} w-14 h-8 flex-shrink-0`}>
                                    <span className={`transform transition-transform duration-200 ease-in-out inline-block h-6 w-6 rounded-full bg-white shadow-lg ${enabled ? 'translate-x-[26px]' : 'translate-x-1'}`}/>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
                            <label htmlFor="syllabus-name" className="text-white font-semibold whitespace-nowrap">ชื่อหลักสูตร</label>
                            <input
                                type="text" id="syllabus-name" value={syllabusName} onChange={(e) => setSyllabusName(e.target.value)}
                                className="p-3 rounded-lg bg-white border border-gray-300 w-full disabled:bg-gray-300 disabled:cursor-not-allowed" placeholder="กรอกชื่อหลักสูตร" 
                                required
                                disabled={!isEditing}
                            />
                        </div>
                        
                        <div className="mt-10 mb-10 "><h2 className="text-white font-semibold border-b border-gray-500 pb-2  mb-2">รายละเอียดหลักสูตร</h2></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                            <label htmlFor="objectives" className="text-white font-semibold pt-2 whitespace-nowrap">จุดประสงค์</label>
                            <textarea
                                id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={4}
                                className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y disabled:bg-gray-300 disabled:cursor-not-allowed" placeholder="กรอกจุดประสงค์ของหลักสูตร"
                                required
                                disabled={!isEditing}
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                            <label htmlFor="structure" className="text-white font-semibold pt-2 whitespace-nowrap">โครงสร้างและเนื้อหา</label>
                            <textarea
                                id="structure" value={structureAndContent} onChange={(e) => setStructureAndContent(e.target.value)} rows={4}
                                className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y disabled:bg-gray-300 disabled:cursor-not-allowed" placeholder="กรอกโครงสร้างและเนื้อหา"
                                required
                                disabled={!isEditing}
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                            <label htmlFor="evaluation" className="text-white font-semibold pt-2 whitespace-nowrap">การประเมินผล</label>
                            <textarea
                                id="evaluation" value={evaluation} onChange={(e) => setEvaluation(e.target.value)} rows={4}
                                className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y disabled:bg-gray-300 disabled:cursor-not-allowed" placeholder="กรอกวิธีการประเมินผล"
                                required
                                disabled={!isEditing}
                            ></textarea>
                        </div>

                        {/* === Section for Managing Courses === */}
                        <div>
                            <h3 className="text-white font-semibold mb-4 ">คอร์สในหลักสูตร</h3>

                            {/* === Box 1: For "Adding" new courses === */}
                            <div className="bg-gray-300 border border-sky-200 rounded-xl p-4 mb-6 shadow-sm">
                                <h4 className=" font-semibold  mb-3 flex items-center gap-2">
                                    <FaPlus /> เพิ่มคอร์สใหม่ในหลักสูตร
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] items-center gap-4">
                                    <Combobox 
                                        label="ID คอร์ส" 
                                        options={courseIdOptions} 
                                        selectedValue={selectedCourseId} 
                                        onChange={handleSelectCourseId} 
                                        placeholder="เลือก ID คอร์สที่จะเพิ่ม" 
                                        disabled={!isEditing} 
                                    />
                                    <Combobox 
                                        label="ชื่อคอร์ส" 
                                        options={courseNameOptions} 
                                        selectedValue={selectedCourseName} 
                                        onChange={handleSelectCourseName} 
                                        placeholder="เลือกชื่อคอร์สที่จะเพิ่ม" 
                                        disabled={!isEditing} 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddCourse} 
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#414e51] hover:bg-[#2b3436] rounded-lg text-white font-semibold transition-colors w-full lg:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed" 
                                        disabled={!isEditing}
                                    >
                                        <FaPlus /> เพิ่มข้อมูลคอร์ส
                                    </button>
                                </div>
                            </div>
                            
                            {/* === Box 2: For "Searching and Filtering" data in the table (Labels Removed) === */}
                            <div className="bg-white border border-sky-200 rounded-xl p-4 my-4 shadow-sm">
                                <h4 className=" font-semibold  mb-3 flex items-center gap-2">
                                    <FaSearch /> ค้นหาและกรองข้อมูล
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* --- Search Input 1 (Label Removed) --- */}
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <FaSearch className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="text" id="filter-id" placeholder="ค้นหาด้วย ID คอร์ส..."
                                            value={filterId} onChange={e => setFilterId(e.target.value)}
                                            className="w-full p-3 bg-white pl-10 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    {/* --- Search Input 2 (Label Removed) --- */}
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <FaSearch className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input type="text" id="filter-name" placeholder="ค้นหาด้วยชื่อคอร์ส..."
                                            value={filterName} onChange={e => setFilterName(e.target.value)}
                                            className="w-full p-3 pl-10 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Table and Card View for displaying filtered results */}
                            <div className="bg-white rounded-lg overflow-hidden shadow">
                                {/* Desktop Table View */}
                                <div className="hidden sm:block">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 w-1/12 text-center border">#</th>
                                                <th scope="col" className="px-6 py-3 w-3/12 text-center border">ID</th>
                                                <th scope="col" className="px-6 py-3 w-5/12 text-center border">ชื่อคอร์ส</th>
                                                <th scope="col" className="px-6 py-3 w-3/12 text-center border">การจัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.length > 0 ? (
                                                filteredCourses.length > 0 ? (
                                                    filteredCourses.map((course, index) => (
                                                        <tr key={course.key} className='text-black'>
                                                            <td className="px-6 py-4 font-medium whitespace-nowrap text-center border border-gray-200">{index + 1}</td>
                                                            <td className="px-6 py-4 text-center border border-gray-200">{course.id}</td>
                                                            <td className="px-6 py-4 text-center border border-gray-200">{course.name}</td>
                                                            <td className="px-6 py-4 text-center border">
                                                                <div className="flex justify-center items-stretch">
                                                                    <button type="button" onClick={() => handleConfirmDeleteCourse(course.key, course.name)} disabled={!isEditing} className="flex-1 flex items-center justify-center font-medium text-gray-800 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                                                                        <FaTrash className="mr-1" />
                                                                        ลบ
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 border border-gray-200">ไม่พบข้อมูลคอร์สที่ตรงกับเงื่อนไขการค้นหา</td>
                                                    </tr>
                                                )
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 border border-gray-200">ยังไม่มีข้อมูลคอร์สในหลักสูตรนี้</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Card View */}
                                <div className="sm:hidden space-y-3 p-4">
                                     {courses.length > 0 ? (
                                         filteredCourses.length > 0 ? (
                                             filteredCourses.map((course, index) => (
                                                 <div key={course.key} className='rounded-lg p-3 text-sm shadow border text-gray-800 border-gray-200'>
                                                      <div className="flex justify-between items-center mb-2">
                                                          <span className="font-semibold">{`#${index + 1} ${course.name}`}</span>
                                                          <span className='text-xs px-2 py-1 rounded whitespace-nowrap bg-gray-200 text-gray-800'>ID: {course.id}</span>
                                                      </div>
                                                      <div className="flex justify-end items-center border-t pt-2 mt-2 gap-4">
                                                          <button type="button" onClick={() => handleConfirmDeleteCourse(course.key, course.name)} disabled={!isEditing} className="flex items-center font-medium text-gray-700 hover:text-red-600 text-sm disabled:text-gray-400 disabled:cursor-not-allowed">
                                                              <FaTrash className="mr-1" />
                                                              ลบ
                                                          </button>
                                                      </div>
                                                 </div>
                                             ))
                                         ) : (
                                             <div className="text-center text-gray-500 p-4">ไม่พบข้อมูลคอร์สที่ตรงกับเงื่อนไขการค้นหา</div>
                                         )
                                     ) : (
                                         <div className="text-center text-gray-500 p-4">ยังไม่ได้เพิ่มคอร์สในหลักสูตรนี้</div>
                                     )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditSyllabusPage;