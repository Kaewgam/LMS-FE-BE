"use client";

import { useState, useRef, useEffect, RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MessageSquareText, Megaphone, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- Custom Hook ---
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


// --- ประเภทข้อมูลและข้อมูลจำลอง ---
type Notification = {
    id: number; type: 'q&a' | 'broadcast'; sender: string; avatar: string; time: string; relativeTime: string; lastMessage?: string; title?: string; status: 'read' | 'unread'; href: string;
};

const initialNotifications: Notification[] = [
    { 
        id: 1, 
        type: 'q&a', 
        sender: "สมศรี มีชัย", 
        avatar: "/images/40.png", 
        time: "10:25 น.", 
        relativeTime: "เมื่อ 5 นาทีที่แล้ว", 
        lastMessage: "อาจารย์คะ ส่งงานแล้วนะคะ", 
        status: "unread", 
        href: "/instructor/q&a/chat/1" 
    },
    // ✨ ลบข้อมูลของ "สมชาย ใจกล้า" ออก
    { 
        id: 3, 
        type: 'broadcast', 
        sender: "LMS Admin", 
        avatar: "/images/40.png", 
        time: "เมื่อวาน", 
        relativeTime: "1 วันที่แล้ว", 
        title: "แจ้งปิดปรับปรุงระบบคืนนี้", 
        status: "read", 
        href: "/instructor/notifications_instructor/details/3" 
    }
];

const menuItems = [
    { key: 'notifications', label: 'การแจ้งเตือนทั้งหมด', href: '/instructor/all_notifications' },
    { key: 'send-messages', label: 'ส่งข้อความถึงผู้เรียน', href: '#' },
    { key: 'q-and-a', label: 'Q&A จากผู้เรียน', href: '#' },
];

const students = [
    { id: 1, name: "สมศรี มีชัย" }, 
    // ✨ ลบข้อมูลของ "สมชาย ใจกล้า" ออก
    { id: 3, name: "มานี ปิติ" },
];

const initialQnaHistory = initialNotifications.filter(noti => noti.type === 'q&a');

const additionalRecipients = [
    'ผู้เรียน : คอร์สของฉันทั้งหมด', 
    'ผู้เรียน : คอร์สภาษาอังกฤษ ป.4', 
    'ผู้เรียน : คอร์สคณิตศาสตร์ ม.1', 
    'ผู้ดูแลสถาบัน'
];


// --- Main Component ---
export default function AllNotificationsPageTeacher() {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [activeMenuItem, setActiveMenuItem] = useState('notifications');
    const [displayedChats, setDisplayedChats] = useState(initialQnaHistory);
    const [comboQuery, setComboQuery] = useState('');
    const [isComboOpen, setIsComboOpen] = useState(false);
    const comboRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(comboRef, () => setIsComboOpen(false));
    const [recipientType, setRecipientType] = useState<'my-courses' | 'other'>('my-courses');
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [selectedRecipient, setSelectedRecipient] = useState<string>('');
    const [inputValue, setInputValue] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => { if (comboQuery === '') { setDisplayedChats(initialQnaHistory); } }, [comboQuery]);

    const handleRemoveNotification = (e: React.MouseEvent, id: number) => {
        e.preventDefault(); e.stopPropagation(); setNotifications(current => current.filter(n => n.id !== id));
    };

    const handleMarkAsRead = (id: number) => {
        setNotifications(current => current.map(n => (n.id === id && n.status === 'unread') ? { ...n, status: 'read' } : n));
        setDisplayedChats(current => current.map(c => (c.id === id && c.status === 'unread') ? { ...c, status: 'read' } : c));
    };

    const filteredStudents = comboQuery === '' ? students : students.filter(s => s.name.toLowerCase().includes(comboQuery.toLowerCase()));

    const handleSubmitNotification = (e: React.FormEvent) => {
        e.preventDefault();
        if (recipientType === 'other' && !selectedRecipient) { toast.error('กรุณาเลือกผู้รับ'); return; }
        if (!subject.trim() || !message.trim()) { toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
        toast.success(`ส่งแจ้งเตือนเรียบร้อยแล้ว!`);
        setRecipientType('my-courses'); setSelectedRecipient(''); setInputValue(''); setSubject(''); setMessage('');
    };

    const filteredRecipients = additionalRecipients.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));

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
                <aside className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-300">
                    <h2 className="text-lg text-center mt-5 font-semibold mb-6 underline">จัดการข้อความ</h2>
                    <nav className="flex flex-col space-y-6">
                        {menuItems.map(item => (
                            <Link key={item.key} href={item.href} onClick={(e) => { if (item.href === '#') { e.preventDefault(); } setActiveMenuItem(item.key); }} className={`px-4 py-2 text-center rounded-xl transition-colors duration-200 ${activeMenuItem === item.key ? 'bg-white border border-gray-300' : 'hover:bg-gray-100'}`}>
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <section className="flex-1 p-6 sm:p-8">
                    {activeMenuItem === 'notifications' && (
                        <>
                            <header className="pb-4 border-b border-gray-300"><h1 className="text-2xl font-semibold ">การแจ้งเตือนทั้งหมด</h1></header>
                            <div className="mt-6 space-y-3">
                               {notifications.length > 0 ? (notifications.map((noti) => { const isUnread = noti.status === 'unread'; return ( <Link key={noti.id} href={noti.href} onClick={() => handleMarkAsRead(noti.id)} className={`group relative block p-4 border rounded-xl transition-all duration-200 ${isUnread ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white border-gray-300 hover:bg-gray-50'}`}> <div className="flex items-start justify-between gap-4"> <div className="flex items-start gap-4"> <Image src={noti.avatar} alt={noti.sender} width={48} height={48} className="rounded-full object-cover border border-gray-300"/> <div className="flex flex-col"> <div className="flex items-center cursor-pointer gap-2"> {noti.type === 'q&a' ? <MessageSquareText size={16} className="text-blue-600"/> : <Megaphone size={16} className="text-orange-600"/>} <p className="font-semibold ">{noti.sender} <span className="text-sm text-gray-500 font-normal ml-2">{noti.time}</span></p> </div> <p className="text-sm text-gray-700 mt-1">{noti.type === 'q&a' ? noti.lastMessage : noti.title}</p> <div className="flex items-center text-xs text-gray-500 gap-2 mt-2"> <span>{noti.relativeTime}</span> {isUnread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>} </div> </div> </div> <button onClick={(e) => handleRemoveNotification(e, noti.id)} aria-label="ลบการแจ้งเตือน" className="absolute top-3 right-3 cursor-pointer text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all duration-200 p-1"><X size={18}/></button> </div> </Link> ); })) : ( <div className="text-center py-16"><p>ไม่มีการแจ้งเตือน</p></div> )}
                            </div>
                        </>
                    )}
                    {activeMenuItem === 'q-and-a' && (
                         <>
                           <header className="pb-4 border-b border-gray-300"><h1 className="text-2xl font-semibold ">Q&A จากผู้เรียน</h1></header>
                            <div className="relative mt-6" ref={comboRef}>
                                <div className="relative"><input type="text" value={comboQuery} onChange={(e) => setComboQuery(e.target.value)} onFocus={() => setIsComboOpen(true)} placeholder="ค้นหาการสนทนาจากผู้เรียน" className="w-full bg-white border border-gray-300 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300" /><div className="cursor-pointer absolute inset-y-0 right-0 flex items-center px-2"><ChevronDown size={20} /></div></div>
                                {isComboOpen && (<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">{filteredStudents.length > 0 ? (filteredStudents.map((student) => (<div key={student.id} onClick={() => { setComboQuery(student.name); setIsComboOpen(false); setDisplayedChats(initialQnaHistory.filter(c => c.sender === student.name)); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{student.name}</div>))) : (<div className="px-4 py-2 ">ไม่พบผู้เรียน</div>)}</div>)}
                            </div>
                            <div className="mt-6 space-y-3">{displayedChats.length > 0 ? (displayedChats.map((chat) => { const isUnread = chat.status === 'unread'; return ( <Link key={chat.id} href={chat.href} onClick={() => handleMarkAsRead(chat.id)} className={`group relative block p-4 border rounded-xl transition-all duration-200 ${isUnread ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-white border-gray-300 hover:bg-gray-50'}`}> <div className="flex items-start justify-between gap-4"> <div className="flex items-start gap-4"> <Image src={chat.avatar} alt={chat.sender} width={48} height={48} className="rounded-full object-cover border border-gray-300"/> <div className="flex flex-col"> <div className="flex items-center gap-2"> <MessageSquareText size={16} className="text-blue-600"/> <p className="font-semibold ">{chat.sender} <span className="text-sm text-gray-500 font-normal ml-2">{chat.time}</span></p> </div> <p className="text-sm text-gray-700 mt-1">{chat.lastMessage}</p> <div className="flex items-center text-xs text-gray-500 gap-2 mt-2"> <span>{chat.relativeTime}</span> {isUnread && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>} </div> </div> </div> </div> </Link> ); })) : ( <div className="text-center text-gray-500 pt-8"><p>ไม่พบข้อมูลการสนทนา</p></div>)}</div>
                        </>
                    )}
                    {activeMenuItem === 'send-messages' && (
                        <>
                            <header className="pb-4 border-b border-gray-300"><h1 className="text-2xl font-semibold ">ส่งข้อความถึงผู้เรียน</h1></header>
                            <form onSubmit={handleSubmitNotification} className="space-y-6 mt-6">
                                <div className="space-y-3">
                                    <label className="block font-medium">ผู้รับข้อความ :</label>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                                        <div className="flex items-center gap-2">
                                            <input type="radio" id="my-courses" name="recipientType" checked={recipientType === 'my-courses'} onChange={() => { setRecipientType('my-courses'); setSelectedRecipient(''); setIsDropdownOpen(false); setInputValue(''); }} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                                            <label htmlFor="my-courses" className="font-medium">ผู้เรียนในคอร์สของฉัน</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="radio" id="other" name="recipientType" checked={recipientType === 'other'} onChange={() => setRecipientType('other')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                                            <label htmlFor="other" className="font-medium">อื่น ๆ</label>
                                        </div>
                                    </div>
                                </div>
                                {recipientType === 'other' && (
                                    <div className="relative w-full max-w-md">
                                        <div className="relative">
                                            <input type="text" value={inputValue} onChange={(e) => { setInputValue(e.target.value); setSelectedRecipient(''); if (!isDropdownOpen) setIsDropdownOpen(true); }} onFocus={() => setIsDropdownOpen(true)} onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} placeholder="กรุณาเลือกหรือค้นหา" className="w-full text-left py-2 px-3 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300" />
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
                                )}
                                <div>
                                    <label htmlFor="subject" className="block font-medium mb-2">หัวข้อเรื่อง</label>
                                    <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300" placeholder="หัวข้อการแจ้งเตือน"/>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block font-medium mb-2">ข้อความที่ต้องการแจ้งเตือน</label>
                                    <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none" placeholder="กรอกข้อความที่นี่..."/>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button type="submit" className="py-2 px-8 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none">ส่งแจ้งเตือน</button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}