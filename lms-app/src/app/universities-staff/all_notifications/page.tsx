"use client";

import { useState, useRef, useEffect, RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Megaphone, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- (คงเดิม) Custom Hook สำหรับจัดการการคลิกนอกพื้นที่ ---
function useOnClickOutside(
    ref: RefObject<HTMLElement | null>,
    handler: (event: MouseEvent | TouchEvent) => void
) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) return;
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}


// --- (ปรับปรุง) ประเภทข้อมูลและข้อมูลจำลองสำหรับผู้ดูแลสถาบัน ---
// ตัด Type 'q&a' ออกไป เหลือแค่ 'broadcast'
type Notification = {
    id: number;
    type: 'broadcast';
    sender: string;
    avatar: string;
    time: string;
    relativeTime: string;
    title: string;
    status: 'read' | 'unread';
    href: string;
};

// (✨ อัปเดต!) ข้อมูลจำลองให้ตรงกับ NavbarSystem ตามคำสั่ง
const initialNotifications: Notification[] = [
    {
        id: 1,
        type: 'broadcast',
        sender: "System Maintenance",
        avatar: "/images/40.png",
        time: "14:30 น.",
        relativeTime: "เมื่อ 1 ชั่วโมงที่แล้ว",
        title: "แจ้งอัปเดตเวอร์ชันระบบ LMS",
        status: "unread",
        href: "/universities-staff/notifications_universities-staff/details/1"
    }
];

// (ปรับปรุง) รายการเมนูสำหรับผู้ดูแล
const menuItems = [
    { key: 'notifications', label: 'การแจ้งเตือนทั้งหมด', href: '#' },
    { key: 'send-broadcast', label: 'ส่งข้อความประกาศ', href: '#' },
];

// (ปรับปรุง) รายชื่อผู้รับสำหรับผู้ดูแล
const recipientGroups = [
    'ผู้ใช้งานทั้งหมด',
    'ผู้สอนทั้งหมด',
    'ผู้เรียนทั้งหมด',
    'ผู้สอน : คณะวิศวกรรมศาสตร์',
    'ผู้สอน : คณะบริหารธุรกิจ',
];


// --- (ปรับปรุง) Main Component สำหรับผู้ดูแลสถาบัน ---
export default function AllNotificationsPageAdmin() {
    // (ปรับปรุง) State ที่ไม่เกี่ยวกับ Q&A แล้ว
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [activeMenuItem, setActiveMenuItem] = useState('notifications');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
    const [inputValue, setInputValue] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    /**
     * ฟังก์ชันสำหรับลบการแจ้งเตือนออกจากลิสต์
     * @param e - Event object เพื่อป้องกันการ redirect ของ Link
     * @param id - ID ของการแจ้งเตือนที่ต้องการลบ
     */
    const handleRemoveNotification = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        setNotifications(current => current.filter(n => n.id !== id));
        toast.success("ลบการแจ้งเตือนแล้ว");
    };

    /**
     * ฟังก์ชันสำหรับเปลี่ยนสถานะการแจ้งเตือนเป็น "อ่านแล้ว"
     * @param id - ID ของการแจ้งเตือนที่ต้องการเปลี่ยนสถานะ
     */
    const handleMarkAsRead = (id: number) => {
        setNotifications(current => current.map(n => (n.id === id && n.status === 'unread') ? { ...n, status: 'read' } : n));
    };
    
    /**
     * ฟังก์ชันสำหรับจัดการการส่งฟอร์มข้อความประกาศ
     * @param e - Event object ของฟอร์ม
     */
    const handleSubmitBroadcast = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRecipient) {
            toast.error('กรุณาเลือกกลุ่มผู้รับ');
            return;
        }
        if (!subject.trim() || !message.trim()) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        toast.success(`ส่งประกาศถึง "${selectedRecipient}" เรียบร้อยแล้ว!`);
        // Reset form fields
        setSelectedRecipient('');
        setInputValue('');
        setSubject('');
        setMessage('');
    };

    // Logic สำหรับกรองรายชื่อผู้รับใน Dropdown
    const filteredRecipients = recipientGroups.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));

    return (
        <main className="min-h-screen p-4 sm:p-6 md:p-8">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: { borderRadius: '8px', fontSize: '16px', padding: '16px 24px', fontWeight: '600' },
                    success: { style: { background: '#F0FDF4', color: 'black' } },
                    error: { style: { background: '#FFF1F2', color: 'black' } },
                }}
            />
            <div className="max-w-5xl mx-auto bg-white border border-gray-300 shadow-lg rounded-2xl flex flex-col md:flex-row overflow-hidden">
                {/* --- Sidebar Menu --- */}
                <aside className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-300">
                    <h2 className="text-lg text-center mt-5 font-semibold mb-6 underline">จัดการข้อความ</h2>
                    <nav className="flex flex-col space-y-6">
                        {menuItems.map(item => (
                            <Link key={item.key} href={item.href} onClick={(e) => { e.preventDefault(); setActiveMenuItem(item.key); }} className={`px-4 py-2 text-center rounded-xl transition-colors duration-200 ${activeMenuItem === item.key ? 'bg-white border border-gray-300' : 'hover:bg-gray-100'}`}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* --- Main Content Section --- */}
                <section className="flex-1 p-6 sm:p-8">
                    {/* --- Section: All Notifications --- */}
                    {activeMenuItem === 'notifications' && (
                        <>
                            <header className="pb-4 border-b border-gray-300"><h1 className="text-2xl font-semibold ">การแจ้งเตือนทั้งหมด</h1></header>
                            <div className="mt-6 space-y-3">
                               {notifications.length > 0 ? (notifications.map((noti) => { const isUnread = noti.status === 'unread'; return ( <Link key={noti.id} href={noti.href} onClick={() => handleMarkAsRead(noti.id)} className={`group relative block p-4 border rounded-xl transition-all duration-200 ${isUnread ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white border-gray-300 hover:bg-gray-50'}`}> <div className="flex items-start justify-between gap-4"> <div className="flex items-start gap-4"> <Image src={noti.avatar} alt={noti.sender} width={48} height={48} className="rounded-full object-cover border border-gray-300"/> <div className="flex flex-col"> <div className="flex items-center cursor-pointer gap-2"> <Megaphone size={16} className="text-orange-600"/> <p className="font-semibold ">{noti.sender} <span className="text-sm text-gray-500 font-normal ml-2">{noti.time}</span></p> </div> <p className="text-sm text-gray-700 mt-1">{noti.title}</p> <div className="flex items-center text-xs text-gray-500 gap-2 mt-2"> <span>{noti.relativeTime}</span> {isUnread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>} </div> </div> </div> <button onClick={(e) => handleRemoveNotification(e, noti.id)} aria-label="ลบการแจ้งเตือน" className="absolute top-3 right-3 cursor-pointer text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all duration-200 p-1"><X size={18}/></button> </div> </Link> ); })) : ( <div className="text-center py-16"><p>ไม่มีการแจ้งเตือน</p></div> )}
                            </div>
                        </>
                    )}

                    {/* --- Section: Send Broadcast Message --- */}
                    {activeMenuItem === 'send-broadcast' && (
                        <>
                            <header className="pb-4 border-b border-gray-300"><h1 className="text-2xl font-semibold ">ส่งข้อความประกาศ</h1></header>
                            <form onSubmit={handleSubmitBroadcast} className="space-y-6 mt-6">
                                <div>
                                    <label className="block font-medium mb-2">กลุ่มผู้รับ</label>
                                    <div className="relative w-full max-w-md">
                                        <div className="relative">
                                            <input type="text" value={inputValue} onChange={(e) => { setInputValue(e.target.value); setSelectedRecipient(''); if (!isDropdownOpen) setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} placeholder="กรุณาเลือกหรือค้นหากลุ่มผู้รับ" className="w-full text-left py-2 px-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
                                            <ChevronDown className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                        {isDropdownOpen && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                {filteredRecipients.length > 0 ? (filteredRecipients.map((option) => (<div key={option}
                                                  onClick={() => { setSelectedRecipient(option); setInputValue(option); setIsDropdownOpen(false); }}
                                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer">{option}</div>))) : (<div className="px-3 py-2 ">ไม่พบข้อมูล</div>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="subject" className="block font-medium mb-2">หัวข้อเรื่อง</label>
                                    <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300" placeholder="หัวข้อการประกาศ"/>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block font-medium mb-2">ข้อความ</label>
                                    <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" placeholder="กรอกข้อความที่นี่..."/>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="py-2 px-8 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none">ส่งข้อความ</button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}