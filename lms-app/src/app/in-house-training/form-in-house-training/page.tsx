'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronDown } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const CustomSelect = ({ name, value, onChange, children }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const options = React.Children.toArray(children) as React.ReactElement<React.OptionHTMLAttributes<HTMLOptionElement>>[];
    const selectedOption = options.find(option => option.props.value === value);
    const displayValue = selectedOption ? selectedOption.props.children : options[0].props.children;
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleOptionClick = (optionValue: string) => {
        const simulatedEvent = {
            target: {
                name: name,
                value: optionValue,
            },
        };
        onChange(simulatedEvent);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={selectRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-sm text-left transition duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300 ${
                    value ? 'border-gray-300 text-gray-900' : 'border-gray-300 text-gray-500'
                }`}
            >
                <span>{displayValue}</span>
                <FaChevronDown className={`transform text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg max-h-60 overflow-auto">
                    {options.map((option, index) => {
                        if (option.props.value === "") return null; 
                        
                        return (
                            <li
                                key={index}
                                onClick={() => handleOptionClick(option.props.value as string)}
                                className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {option.props.children}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};


const Page = () => {
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', position: '', company: '',
        email: '', phone: '', interest: '', role: '',
        decisionMaker: '', channel: '', lmsUsage: '', message: '', consent: '',
    });

    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
    const validatePhoneNumber = (phone: string) => /^[0-9]{10}$/.test(phone);

    const handleChange = (e: any) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            if (value === '' || /^[0-9]*$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: value }));
                if (value !== '' && !validatePhoneNumber(value)) setPhoneError('กรุณากรอกเบอร์โทรให้ถูกต้อง 10 หลัก');
                else setPhoneError('');
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'email') {
            if (value !== '' && !validateEmail(value)) setEmailError('กรุณากรอกอีเมลให้ถูกต้อง เช่น example@domain.com');
            else setEmailError('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (emailError || phoneError) return;

        const allFieldsFilled = Object.entries(formData).every(([key, value]) =>
            key === 'message' ? true : value.trim() !== ''
        );

        if (!allFieldsFilled) {
            toast.error('กรุณากรอกข้อมูลในช่องที่มีเครื่องหมาย * ให้ครบถ้วน');
            return;
        }

        console.log(formData);

        toast.success('ส่งแบบฟอร์มสำเร็จ!');
        setTimeout(() => {
            router.push('/home');
        }, 1500);
    };
    
    const inputClasses =
        'w-full rounded-lg border border-gray-300 p-3 text-sm transition duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-gray-300';
    const isButtonDisabled = !!emailError || !!phoneError;

    return (
        <div className="min-h-screen py-10 sm:py-16">
            <div className="mx-auto max-w-4xl rounded-xl border border-gray-300 p-8 shadow-lg sm:p-10">
                <Toaster
                    position="top-center"
                    reverseOrder={false}
                    toastOptions={{
                    style: { borderRadius: '8px', fontSize: '16px', padding: '16px 24px', fontWeight: '600' },
                    error: { style: { background: '#FFF1F2', color: 'black' } },
                    success: { style: { background: '#F0FDF4', color: 'black' } },
                    }}
                />
                
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-gray-800">กรอกข้อมูลเพื่อลงทะเบียนรับคำปรึกษาจากผู้เชี่ยวชาญ</h1>
                    <h2 className="mt-2 text-base text-gray-600">พูดคุยกับทีมงานและรับข้อเสนอสุดพิเศษสำหรับลูกค้าองค์กร</h2>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <input name="firstName" autoComplete="off" placeholder="ชื่อ*" value={formData.firstName} onChange={handleChange} className={inputClasses} required />
                        <input name="lastName" autoComplete="off" placeholder="นามสกุล*" value={formData.lastName} onChange={handleChange} className={inputClasses} required />
                        <input name="position" autoComplete="off" placeholder="ตำแหน่ง*" value={formData.position} onChange={handleChange} className={inputClasses} required />
                        <input name="company" autoComplete="off" placeholder="บริษัท/หน่วยงาน*" value={formData.company} onChange={handleChange} className={inputClasses} required />
                    </div>

                    <div>
                        <input name="email" type="email" autoComplete="off" placeholder="อีเมล*" value={formData.email} onChange={handleChange} className={inputClasses} required />
                        {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
                    </div>

                    <div>
                        <input name="phone" autoComplete="off" placeholder="เบอร์โทรศัพท์*" value={formData.phone} onChange={handleChange} className={inputClasses} required />
                        {phoneError && <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <CustomSelect name="interest" value={formData.interest} onChange={handleChange}>
                            <option value="">คุณสนใจบริการแบบใด*</option>
                            <option value="training">ฝึกอบรม</option>
                            <option value="platform">แพลตฟอร์ม</option>
                        </CustomSelect>

                        <CustomSelect name="role" value={formData.role} onChange={handleChange}>
                            <option value="">หัวข้อที่คุณสนใจ*</option>
                            <option value="data">Data</option>
                            <option value="ai">AI</option>
                        </CustomSelect>

                        <div className="sm:col-span-2">
                            <CustomSelect name="decisionMaker" value={formData.decisionMaker} onChange={handleChange}>
                                <option value="">คุณมีอำนาจตัดสินใจเองหรือไม่*</option>
                                <option value="yes">ใช่</option>
                                <option value="no">ไม่ใช่</option>
                            </CustomSelect>
                        </div>
                    </div>

                    <CustomSelect name="channel" value={formData.channel} onChange={handleChange}>
                        <option value="">คุณรู้จักเราผ่านช่องทางใด*</option>
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="friend">เพื่อนแนะนำ</option>
                    </CustomSelect>

                    <CustomSelect name="lmsUsage" value={formData.lmsUsage} onChange={handleChange}>
                        <option value="">คุณใช้หรือเคยใช้แพลตฟอร์ม e-learning ใดอยู่*</option>
                        <option value="moodle">Moodle</option>
                        <option value="schoology">Schoology</option>
                        <option value="other">อื่น ๆ</option>
                    </CustomSelect>

                    <textarea name="message" value={formData.message} onChange={handleChange} placeholder="ระบุความต้องการอื่น ๆ เพิ่มเติม (ถ้ามี)" className={inputClasses} rows={3} />
                    
                    <div className="mt-4 space-y-4">
                        <p className="text-sm leading-relaxed text-gray-600">
                            ข้อมูลส่วนบุคคลทั้งหมดที่ให้ไว้กับ LMS จะใช้เพื่อติดต่อแจ้งข้อมูลเพิ่มเติมเกี่ยวกับหลักสูตร และประมวลผลตามคำขอของคุณเท่านั้น
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                            คุณยินยอมให้ตัวแทนของ LMS ติดต่อคุณเพื่อบริการอื่นๆ ที่เหมาะสมผ่านเบอร์โทรหรืออีเมลที่ให้ไว้หรือไม่*
                        </p>
                        <div className="flex flex-col gap-2 text-sm">
                            <label className="flex cursor-pointer items-center gap-2.5 p-1">
                                {/* --- ✅ แก้ไข: เพิ่ม focus ring --- */}
                                <input type="radio" name="consent" value="yes" onChange={handleChange} required className="h-4 w-4 rounded-full text-blue-600 " />
                                <span className="text-gray-700">ยินยอม</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-2.5 p-1">
                                {/* --- ✅ แก้ไข: เพิ่ม focus ring --- */}
                                <input type="radio" name="consent" value="no" onChange={handleChange} required className="h-4 w-4 rounded-full text-blue-600 " />
                                <span className="text-gray-700">ไม่ยินยอม</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            type="submit"
                            className={` max-w-xs transform rounded-xl border-none px-10 py-3 text-base font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-105
                            ${isButtonDisabled
                                ? 'cursor-not-allowed bg-gray-400'
                                : 'bg-[#414E51] hover:bg-[#2b3436]'
                            }`}
                            disabled={isButtonDisabled}
                        >
                            ส่งแบบฟอร์ม
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Page;