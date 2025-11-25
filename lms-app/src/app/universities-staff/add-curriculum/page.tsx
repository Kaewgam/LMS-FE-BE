// ระบุว่าโค้ดนี้จะทำงานฝั่ง Client (ใน Browser ของผู้ใช้)
'use client';

// --- การนำเข้า (Imports) ---
// นำเข้าเครื่องมือที่จำเป็นจาก React และ Next.js
import React, { useState, useMemo, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
// นำเข้าไอคอนจากไลบรารี react-icons
import { FaPlus, FaChevronDown, FaTrash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
// นำเข้าไลบรารีสำหรับการแจ้งเตือน (Toast notification)
import toast, { Toaster } from 'react-hot-toast';

// --- พิมพ์เขียวข้อมูล (Interfaces) ---

// พิมพ์เขียวสำหรับ "ตัวเลือก" ใน Combobox (ต้องมี value และ label)
interface Option {
    value: string | number;
    label: string;
}

// พิมพ์เขียวสำหรับ "ข้อมูลคอร์สตั้งต้น" ที่มีในระบบ
interface CourseOption {
    id: string;
    name: string;
}

// --- ข้อมูลตั้งต้น (Initial Data) ---
// คลังข้อมูลคอร์สทั้งหมดที่มีในระบบ (ข้อมูลสมมติ)
const allCoursesData: CourseOption[] = [
    { id: 'CS101', name: 'วิทยาการคอมพิวเตอร์เบื้องต้น' },
    { id: 'WD202', name: 'การพัฒนาเว็บขั้นสูงด้วย MERN Stack' },
    { id: 'UX301', name: 'หลักการออกแบบ UX/UI สำหรับแอปพลิเคชัน' },
    { id: 'DM405', name: 'กลยุทธ์การตลาดดิจิทัล' },
    { id: 'DA550', name: 'การวิเคราะห์ข้อมูลด้วย Python และ Pandas' },
    { id: 'BE100', name: 'ความรู้เบื้องต้นเกี่ยวกับธุรกิจออนไลน์' },
    { id: 'GD210', name: 'การออกแบบกราฟิกสำหรับสื่อดิจิทัล' },
];

// พิมพ์เขียวสำหรับ "คอร์สที่ถูกเพิ่มเข้ามา" ในตารางหลักสูตร
interface Course {
    key: number; // key สำหรับ React ใช้แยกแยะ item ในลิสต์
    id: string;
    name: string;
}

// พิมพ์เขียวสำหรับ "Props" ที่จะส่งให้ Combobox component
interface ComboboxProps {
    label: string;
    options: Option[];
    selectedValue: Option | null;
    onChange: (value: Option | null) => void;
    placeholder?: string;
    isRequired?: boolean;
}

/* --- คอมโพเนนต์ย่อย: Combobox --- */
// เป็นกล่องค้นหาพร้อมตัวเลือก (Searchable Dropdown) ที่สร้างขึ้นเพื่อใช้ซ้ำ
const Combobox: React.FC<ComboboxProps> = ({ label, options, selectedValue, onChange, placeholder, isRequired }) => {
    // State สำหรับเก็บข้อความที่ผู้ใช้พิมพ์ค้นหา
    const [searchQuery, setSearchQuery] = useState(selectedValue ? selectedValue.label : '');
    // State สำหรับควบคุมการเปิด/ปิดของรายการตัวเลือก
    const [isOptionsOpen, setIsOptionsOpen] = useState(false);
    const comboboxRef = useRef<HTMLDivElement>(null);

    // เมื่อค่า selectedValue จากข้างนอกเปลี่ยน ให้อัปเดตค่าในช่องค้นหาด้วย
    useEffect(() => {
        setSearchQuery(selectedValue ? selectedValue.label : '');
    }, [selectedValue]);

    // Logic สำหรับการปิด Dropdown เมื่อผู้ใช้คลิกนอกพื้นที่ของ Combobox
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

    // Logic การกรอง (filter) ตัวเลือกตามที่ผู้ใช้พิมพ์ค้นหา (ใช้ useMemo เพื่อประสิทธิภาพ)
    const filteredOptions = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return options;
        return options.filter(option => option.label.toLowerCase().includes(query));
    }, [searchQuery, options]);

    // ส่วนแสดงผลของ Combobox
    return (
        <div className="relative" ref={comboboxRef}>
            <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onChange(null); // ล้างค่าที่เลือกไว้เมื่อมีการพิมพ์ใหม่
                    if (!isOptionsOpen) setIsOptionsOpen(true);
                }}
                onFocus={() => setIsOptionsOpen(true)}
                className="w-full p-3 pr-10 rounded-lg bg-white border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                required={isRequired && !selectedValue}
            />
            <button
                type="button"
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                <FaChevronDown />
            </button>
            {/* แสดงรายการตัวเลือกเมื่อ isOptionsOpen เป็น true */}
            {isOptionsOpen && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(option => (
                            <li
                                key={option.value}
                                onClick={() => {
                                    onChange(option); // ส่งค่าที่เลือกกลับไป
                                    setSearchQuery(option.label);
                                    setIsOptionsOpen(false); // ปิดรายการตัวเลือก
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

/* --- คอมโพเนนต์ย่อย: ConfirmationModal --- */
// พิมพ์เขียวสำหรับ Props ที่จะส่งให้ ConfirmationModal component
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}
// เป็นหน้าต่าง Popup สำหรับยืนยันการกระทำ (เช่น การลบ)
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    // ถ้า modal ไม่ได้เปิด ก็ไม่ต้องแสดงผลอะไร
    if (!isOpen) return null;

    // ตรวจสอบว่าเป็นการกระทำที่เกี่ยวกับการ "ลบ" หรือไม่ เพื่อเปลี่ยนสีปุ่มยืนยัน
    const isDeleteAction = title.includes('ลบ');
    const confirmButtonColor = isDeleteAction ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

    // ส่วนแสดงผลของ Modal
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


/* --- คอมโพเนนต์หลัก: AddSyllabusPage --- */
const AddSyllabusPage: React.FC = () => {
    const router = useRouter();

    // --- States สำหรับเก็บข้อมูลในฟอร์มหลัก ---
    const [syllabusName, setSyllabusName] = useState('');
    const [objectives, setObjectives] = useState('');
    const [structureAndContent, setStructureAndContent] = useState('');
    const [evaluation, setEvaluation] = useState('');
    const [enabled, setEnabled] = useState(true); // State ของสวิตช์เปิด/ปิดหลักสูตร

    // --- States สำหรับจัดการคอร์สในตาราง ---
    const [courses, setCourses] = useState<Course[]>([]); // เก็บลิสต์คอร์สที่ถูกเพิ่มเข้ามาแล้ว
    const [selectedCourseId, setSelectedCourseId] = useState<Option | null>(null); // เก็บค่า ID ที่เลือกจาก Combobox
    const [selectedCourseName, setSelectedCourseName] = useState<Option | null>(null); // เก็บค่า Name ที่เลือกจาก Combobox
    const [nextCourseKey, setNextCourseKey] = useState(1); // ใช้สร้าง key ที่ไม่ซ้ำกัน

    // --- State สำหรับควบคุม Modal ยืนยัน ---
    const [confirmationModal, setConfirmationModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // --- เตรียมข้อมูลสำหรับ Combobox (ใช้ useMemo เพื่อประสิทธิภาพ) ---
    // จะคำนวณรายชื่อคอร์สที่ยังไม่ได้เพิ่มใหม่ ต่อเมื่อ state `courses` เปลี่ยนแปลงเท่านั้น
    const courseIdOptions = useMemo(() => {
        const addedCourseIds = new Set(courses.map(c => c.id));
        // กรองคอร์สที่ถูกเพิ่มไปแล้วออกไป และแปลงข้อมูลให้เป็นรูปแบบ { value, label }
        return allCoursesData.filter(course => !addedCourseIds.has(course.id)).map(course => ({ value: course.id, label: course.id }));
    }, [courses]);

    const courseNameOptions = useMemo(() => {
        const addedCourseNames = new Set(courses.map(c => c.name));
        return allCoursesData.filter(course => !addedCourseNames.has(course.name)).map(course => ({ value: course.name, label: course.name }));
    }, [courses]);


    // --- ฟังก์ชันจัดการเหตุการณ์ (Event Handlers) ---

    // เมื่อเลือก 'ID คอร์ส', ให้ 'ชื่อคอร์ส' ใน Combobox อีกอันเปลี่ยนตาม
    const handleSelectCourseId = (option: Option | null) => {
        setSelectedCourseId(option);
        if (option) {
            const matchedCourse = allCoursesData.find(c => c.id === option.value);
            if (matchedCourse) {
                setSelectedCourseName({ value: matchedCourse.name, label: matchedCourse.name });
            } else {
                setSelectedCourseName(null);
            }
        } else {
            setSelectedCourseName(null);
        }
    };

    // เมื่อเลือก 'ชื่อคอร์ส', ให้ 'ID คอร์ส' ใน Combobox อีกอันเปลี่ยนตาม
    const handleSelectCourseName = (option: Option | null) => {
        setSelectedCourseName(option);
        if (option) {
            const matchedCourse = allCoursesData.find(c => c.name === option.value);
            if (matchedCourse) {
                setSelectedCourseId({ value: matchedCourse.id, label: matchedCourse.id });
            } else {
                setSelectedCourseId(null);
            }
        } else {
            setSelectedCourseId(null);
        }
    };

    // เมื่อกดปุ่ม 'เพิ่มข้อมูลคอร์ส': ตรวจสอบข้อมูลแล้วเพิ่มลงใน state `courses`
    const handleAddCourse = () => {
        const courseId = selectedCourseId?.label.trim();
        const courseName = selectedCourseName?.label.trim();
        if (courseId && courseName) {
            // ตรวจสอบว่าเคยเพิ่มคอร์สนี้ไปแล้วหรือยัง
            if (courses.some(course => course.id === courseId)) {
                toast.error(`คอร์ส ID: ${courseId} ถูกเพิ่มไปแล้ว`);
                return;
            }
            // ตรวจสอบว่า ID กับ Name ที่เลือกตรงกันและมีในระบบจริง
            const isValidCourse = allCoursesData.some(c => c.id === courseId && c.name === courseName);
            if (!isValidCourse) {
                toast.error('ID และชื่อคอร์สไม่ตรงกัน หรือไม่พบข้อมูลในระบบ');
                return;
            }
            // เพิ่มคอร์สใหม่เข้าไปใน state
            setCourses([...courses, { key: nextCourseKey, id: courseId, name: courseName }]);
            setNextCourseKey(nextCourseKey + 1);
            // ล้างค่าใน Combobox
            setSelectedCourseId(null);
            setSelectedCourseName(null);
        } else {
            toast.error('กรุณาเลือกหรือกรอกทั้ง ID และชื่อคอร์สให้ถูกต้อง');
        }
    };

    // ฟังก์ชันสำหรับเปิด/ปิด Modal
    const openConfirmationModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmationModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirmationModal = () => {
        setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    };

    // เมื่อกดปุ่ม 'ลบ' ในตาราง: จะเปิด Modal ขึ้นมาถามเพื่อยืนยัน
    const handleConfirmDeleteCourse = (keyToDelete: number, courseName: string) => {
        openConfirmationModal(
            'ยืนยันการลบคอร์ส',
            `คุณแน่ใจหรือไม่ว่าต้องการลบคอร์ส "${courseName}" ออกจากหลักสูตรนี้?`,
            () => {
                // Logic ที่จะทำงานเมื่อผู้ใช้กดยืนยันใน Modal
                setCourses(courses.filter(course => course.key !== keyToDelete));
                closeConfirmationModal();
                toast.success(`ลบคอร์ส "${courseName}" เรียบร้อยแล้ว`);
            }
        );
    };

    // เมื่อกดปุ่ม 'บันทึกหลักสูตร': ตรวจสอบข้อมูลทั้งหมดแล้วส่ง
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บโหลดใหม่

        // ตรวจสอบว่ากรอกข้อมูลหลักสูตรครบหรือไม่
        if (!syllabusName.trim() || !objectives.trim() || !structureAndContent.trim() || !evaluation.trim()) {
            toast.error('กรุณากรอกข้อมูลหลักสูตรให้ครบถ้วน (ชื่อ, จุดประสงค์, โครงสร้าง, การประเมินผล)');
            return;
        }

        // แสดงข้อมูลที่บันทึกใน Console (ของจริงคือการส่งไปที่ Server)
        console.log("✅ Form Data Saved:", {
            syllabusName,
            objectives,
            structureAndContent,
            evaluation,
            courses,
            enabled,
        });

        toast.success("สร้างหลักสูตรสำเร็จ!");
        // พาผู้ใช้กลับไปหน้าจัดการหลักสูตรหลังผ่านไป 1.5 วินาที
        setTimeout(() => {
            router.push('/universities-staff/management-curriculum');
        }, 1500);
    };

    // --- ส่วนแสดงผลของหน้า (UI Rendering) ---
    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-[#F5F5F5]">
            {/* Component สำหรับแสดงการแจ้งเตือน (Toast) */}
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: { borderRadius: '8px', fontSize: '16px', padding: '16px 24px', fontWeight: '600' },
                    success: { style: { background: '#F0FDF4', color: 'black' } },
                    error: { style: { background: '#FFF1F2', color: 'black' } },
                }}
            />
            {/* แสดง Modal ยืนยัน (จะแสดงเมื่อ state `isOpen` เป็น true) */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={closeConfirmationModal}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
            />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end">
                    <h1 className="text-2xl sm:text-2xl font-semibold mb-4 sm:mb-0">สร้างหลักสูตร</h1>
                </div>

                {/* UI ของสวิตช์เปิด/ปิดหลักสูตร */}
                <div className="flex justify-end mb-6">
                    <div
                        className={`relative flex items-center p-1.5 rounded-full cursor-pointer ${enabled ? 'bg-[#414E51]' : 'bg-[#414E51]'} transition-colors duration-200 ease-in-out w-[200px] h-[48px] justify-between`}
                        onClick={() => setEnabled(!enabled)}
                    >
                        <span className="text-sm font-semibold ml-2 select-none text-white">เปิดใช้งานหลักสูตร</span>
                        <div className={`relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out ${enabled ? 'bg-green-500' : 'bg-gray-500'} w-14 h-8 flex-shrink-0`}>
                            <span className={`transform transition-transform duration-200 ease-in-out inline-block h-6 w-6 rounded-full bg-white shadow-lg ${enabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
                        </div>
                    </div>
                </div>

                {/* ส่วนฟอร์มหลัก (พื้นหลังสีเข้ม) */}
                <div className="bg-[#414E51] rounded-xl shadow-lg p-6 sm:p-8">
                    <form onSubmit={handleSubmit} id="add-syllabus-form" className="space-y-8">

                        {/* ... (ช่องกรอกข้อมูลหลักสูตร) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-center">
                            <label htmlFor="syllabus-name" className="text-white font-semibold whitespace-nowrap">ชื่อหลักสูตร</label>
                            <input
                                type="text" id="syllabus-name" value={syllabusName} onChange={(e) => setSyllabusName(e.target.value)}
                                className="p-3 rounded-lg bg-white border border-gray-300 w-full" placeholder="กรอกชื่อหลักสูตร" required
                            />
                        </div>
                        
                        <div>
                             <h2 className="text-white text-lg font-semibold border-b border-gray-500 pb-2 mb-2">
                                 รายละเอียดหลักสูตร
                               </h2>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                             <label htmlFor="objectives" className="text-white font-semibold pt-2 whitespace-nowrap">จุดประสงค์</label>
                             <textarea
                                 id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={4}
                                 className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y" placeholder="กรอกจุดประสงค์ของหลักสูตร"
                                 required
                             ></textarea>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                             <label htmlFor="structure" className="text-white font-semibold pt-2 whitespace-nowrap">โครงสร้างและเนื้อหา</label>
                             <textarea
                                 id="structure" value={structureAndContent} onChange={(e) => setStructureAndContent(e.target.value)} rows={4}
                                 className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y" placeholder="กรอกโครงสร้างและเนื้อหา"
                                 required
                             ></textarea>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-y-4 md:gap-x-4 items-start">
                             <label htmlFor="evaluation" className="text-white font-semibold pt-2 whitespace-nowrap">การประเมินผล</label>
                             <textarea
                                 id="evaluation" value={evaluation} onChange={(e) => setEvaluation(e.target.value)} rows={4}
                                 className="p-3 rounded-lg bg-white border border-gray-300 w-full resize-y" placeholder="กรอกวิธีการประเมินผล"
                                 required
                             ></textarea>
                         </div>

                        {/* --- ส่วนจัดการคอร์ส: ประกอบด้วย Combobox 2 อันและปุ่มเพิ่ม --- */}
                        <div>
                            <h3 className="text-white font-semibold mb-4">คอร์สในหลักสูตร</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] items-center gap-4 mb-4">
                                <Combobox label="ID คอร์ส" options={courseIdOptions} selectedValue={selectedCourseId} onChange={handleSelectCourseId} placeholder="รหัสคอร์ส" />
                                <Combobox label="ชื่อคอร์ส" options={courseNameOptions} selectedValue={selectedCourseName} onChange={handleSelectCourseName} placeholder="ชื่อคอร์ส" />
                                <button type="button" onClick={handleAddCourse} className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-200 rounded-lg  font-semibold transition-colors w-full lg:w-auto">
                                    <FaPlus className="inline" /> เพิ่มข้อมูลคอร์ส
                                </button>
                            </div>
                            <div className="bg-white rounded-lg overflow-hidden">
                                {/* --- ตารางสำหรับแสดงผลบนจอใหญ่ (Desktop) --- */}
                                <div className="hidden sm:block">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-100 font-semibold ">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 w-1/12 text-center border border-gray-300">#</th>
                                                <th scope="col" className="px-6 py-3 w-3/12 text-center border border-gray-300">รหัสคอร์ส</th>
                                                <th scope="col" className="px-6 py-3 w-5/12 text-center border border-gray-300">ชื่อคอร์ส</th>
                                                <th scope="col" className="px-6 py-3 w-3/12 text-center border border-gray-300">การจัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {courses.length > 0 ? (
                                                courses.map((course, index) => (
                                                    <tr key={course.key} className="text-gray-800">
                                                        <td className="px-6 py-4 font-medium whitespace-nowrap text-center border border-gray-300">{index + 1}</td>
                                                        <td className="px-6 py-4 text-center border border-gray-300">{course.id}</td>
                                                        <td className="px-6 py-4 text-center border border-gray-300">{course.name}</td>
                                                        <td className="px-6 py-4 text-center border border-gray-300">
                                                            <div className="flex justify-center items-stretch">
                                                                <button type="button" onClick={() => handleConfirmDeleteCourse(course.key, course.name)} className="flex-1 flex items-center justify-center font-medium text-gray-800 hover:text-red-600">
                                                                    <FaTrash className="mr-1" />
                                                                    ลบ
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 border border-gray-200">ยังไม่มีข้อมูลคอร์ส</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* --- การ์ดสำหรับแสดงผลบนจอมือถือ (Mobile) --- */}
                                <div className="sm:hidden space-y-3 p-4">
                                      {courses.length > 0 ? (
                                           courses.map((course, index) => (
                                                <div key={course.key} className="rounded-lg p-3 text-sm shadow border text-gray-800 border-gray-200">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-semibold">{`#${index + 1} ${course.name}`}</span>
                                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">ID: {course.id}</span>
                                                    </div>
                                                    <div className="flex justify-end items-center border-t pt-2 mt-2 gap-4">
                                                        <button type="button" onClick={() => handleConfirmDeleteCourse(course.key, course.name)} className="flex items-center font-medium text-gray-700 hover:text-red-600 text-sm">
                                                            <FaTrash className="mr-1" />
                                                            ลบ
                                                        </button>
                                                    </div>
                                                </div>
                                           ))
                                       ) : (
                                            <div className="text-center text-gray-500 p-4">ยังไม่ได้เพิ่มคอร์ส</div>
                                       )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* --- ปุ่ม 'บันทึกหลักสูตร' ท้ายฟอร์ม --- */}
                <div className="flex justify-center items-center pt-8 mb-8">
                    <button
                        type="submit"
                        form="add-syllabus-form" // เชื่อมปุ่มนี้กับ form ด้านบน
                        className="px-8 py-3 bg-[#414E51] hover:bg-[#2b3436] text-white font-semibold rounded-lg transition-colors shadow-lg"
                    >
                        บันทึกหลักสูตร
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddSyllabusPage;