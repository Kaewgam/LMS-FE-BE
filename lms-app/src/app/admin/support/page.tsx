'use client';

import React, { useState, useMemo, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, ChatBubbleLeftRightIcon, ClockIcon, CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

// --- Interfaces (กำหนดโครงสร้างข้อมูล) ---
interface Ticket {
    id: number;
    title: string;
    requester: string;
    institution: string;
    email: string;
    details: string;
    submittedAt: Date;
    status: 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'เสร็จสิ้น';
    reply?: string;
    repliedAt?: Date;
    isRead: boolean;
}

interface TicketDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    ticket: Ticket | null;
    onReply: (ticketId: number, replyText: string) => void;
}

// --- ฟังก์ชันช่วย: สร้าง Chip สถานะ ---
const getStatusChip = (status: Ticket['status']) => {
    const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full";
    switch (status) {
        case 'รอดำเนินการ': return `${baseClasses} bg-yellow-100 text-yellow-800`;
        case 'กำลังดำเนินการ': return `${baseClasses} bg-blue-100 text-blue-800`;
        case 'เสร็จสิ้น': return `${baseClasses} bg-gray-200 `;
        default: return `${baseClasses} bg-gray-200 `;
    }
};

// --- ข้อมูลจำลอง ---
const initialTickets: Ticket[] = [
    { id: 9999, title: 'ระบบลงทะเบียนล่าช้าๆ', requester: 'อ.สมชาย ใจดี', institution: "ผู้สอน", email: 'somchai@kmitl.ac.th', details: 'ระบบไม่รองรับการอัปโหลดไฟล์ PDF ขนาดใหญ่ ทำให้นักศึกษาส่งงานไม่ได้ ช่วยแก้ให้หน่อยนะคะ โมโหมากตอนนี้', submittedAt: new Date('2024-02-14T21:20:00'), status: 'รอดำเนินการ', isRead: false },
    { id: 1001, title: 'ระบบลงทะเบียนเรียนล่าช้า', requester: 'คริสติน่า แช่แต้', institution: 'ผู้ดูแลสถาบัน', email: 'tina@example.com', details: 'รายละเอียดปัญหา...', submittedAt: new Date('2024-01-15T17:30:00'), status: 'กำลังดำเนินการ', isRead: true },
    { id: 1002, title: 'หิวข้าว', requester: 'สมบัติ มีชัย', institution: 'ผู้เรียน', email: 'sombat@example.com', details: 'รายละเอียดปัญหา...', submittedAt: new Date('2024-01-14T10:00:00'), status: 'เสร็จสิ้น', isRead: true, reply: 'จริงครับ', repliedAt: new Date('2024-01-14T11:00:00')},
    { id: 1003, title: 'วิดีโอในคอร์สไม่เล่น', requester: 'มณีรัตน์ วงศ์ตระกูล', institution: 'ผู้สอน', email: 'maneerat@example.com', details: 'รายละเอียดปัญหา...', submittedAt: new Date('2024-01-13T15:45:00'), status: 'รอดำเนินการ', isRead: false },
    { id: 1004, title: 'เข้าสู่ระบบไม่ได้', requester: 'อนันต์ ชื่นชม', institution: 'ผู้เรียน', email: 'anan@example.com', details: 'รายละเอียดปัญหา...', submittedAt: new Date('2024-01-12T11:20:00'), status: 'กำลังดำเนินการ', isRead: true },
];

// --- Modal Component ---
const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, ticket, onReply }) => {
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setReplyText('');
        }
    }, [isOpen]);

    if (!isOpen || !ticket) return null;

    const handleReplyClick = () => {
        if (replyText.trim()) {
            onReply(ticket.id, replyText);
        } else {
            toast.error('กรุณากรอกข้อความตอบกลับ');
        }
    };
    
    const formatDate = (date: Date) => date.toLocaleString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-50 p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-2">ข้อมูลคำร้อง #{ticket.id}</p>
                    <h2 className="text-2xl font-semibold">{ticket.title}</h2>
                    <div className="mt-3">
                        <span className={getStatusChip(ticket.status)}>{ticket.status}</span>
                    </div>
                </div>
                <div className="p-6 pt-0 overflow-y-auto space-y-6">
                    <div className="space-y-1">
                        <p className="font-semibold">รายละเอียดคำร้อง</p>
                        <p className="p-3 bg-gray-100 rounded-md border border-gray-300">{ticket.details}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="flex flex-col"><span className="font-semibold mb-1">ผู้ร้องเรียน :</span> <span className="text-gray-600">{ticket.requester}</span></div>
                        <div className="flex flex-col"><span className="font-semibold mb-1">สถานะ :</span> <span className="text-gray-600">{ticket.institution}</span></div>
                        <div className="flex flex-col"><span className="font-semibold mb-1">วันที่ร้องเรียน :</span> <span className="text-gray-600">{formatDate(ticket.submittedAt)}</span></div>
                        <div className="flex flex-col"><span className="font-semibold mb-1">อีเมล :</span> <span className="text-gray-600">{ticket.email}</span></div>
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold">ประวัติการดำเนินการ</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            <li>ส่งข้อร้องเรียน - {formatDate(ticket.submittedAt)}</li>
                            {ticket.isRead && <li>รับทราบ - {formatDate(ticket.submittedAt)}</li>}
                            {ticket.repliedAt && <li>ตอบกลับ - {formatDate(ticket.repliedAt)}</li>}
                        </ul>
                    </div>
                    {ticket.status === 'เสร็จสิ้น' ? (
                        <div className="space-y-1">
                            <p className="font-semibold">ข้อความตอบกลับ</p>
                            <p className="text-gray-600 text-sm">{ticket.reply}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="font-semibold">ตอบกลับ</p>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={4}
                                placeholder="ป้อนข้อความตอบกลับ..."
                                className="w-full mt-1 p-2 border rounded-md focus:ring-1 focus:ring-gray-300"
                            />
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 mt-auto">
                    <button onClick={onClose} className="py-2 px-5 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer">
                        ปิด
                    </button>
                    {ticket.status !== 'เสร็จสิ้น' && (
                        <button onClick={handleReplyClick} className="py-2 px-5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
                            รับทราบคำร้อง
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
const ComplaintManagementPage: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ทั้งหมด');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const filteredTickets = useMemo(() => {
        return tickets
            .filter(ticket => {
                if (activeFilter === 'ทั้งหมด') return true;
                return ticket.status === activeFilter;
            })
            .filter(ticket =>
                ticket.requester.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [tickets, searchTerm, activeFilter]);

    const stats = useMemo(() => ({
        all: tickets.length,
        pending: tickets.filter(t => t.status === 'รอดำเนินการ').length,
        inProgress: tickets.filter(t => t.status === 'กำลังดำเนินการ').length,
        completed: tickets.filter(t => t.status === 'เสร็จสิ้น').length,
    }), [tickets]);

    const handleViewTicket = (ticketId: number) => {
        const updatedTickets = tickets.map(t => {
            if (t.id === ticketId && t.status === 'รอดำเนินการ') {
                const newStatus: Ticket['status'] = 'กำลังดำเนินการ';
                return { ...t, status: newStatus, isRead: true };
            }
            return t;
        });
        setTickets(updatedTickets);
        const ticketToShow = updatedTickets.find(t => t.id === ticketId);
        setSelectedTicket(ticketToShow || null);
        setIsModalOpen(true);
    };

    const handleReply = (ticketId: number, replyText: string) => {
        const updatedTickets = tickets.map(t => {
            if (t.id === ticketId) {
                const newStatus: Ticket['status'] = 'เสร็จสิ้น';
                return { ...t, status: newStatus, reply: replyText, repliedAt: new Date() };
            }
            return t;
        });
        setTickets(updatedTickets);
        toast.success(`ตอบกลับคำร้อง #${ticketId} เรียบร้อยแล้ว`);
        setIsModalOpen(false);
    };
    
    const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: number }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
            <div className="text-gray-400">{icon}</div>
            <div>
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-sm text-gray-500">{title}</p>
            </div>
        </div>
    );
    
    const filterButtons = ['ทั้งหมด', 'รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'];

    return (
        <div className="p-4 sm:p-8 min-h-screen font-sans ">
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
            
            <TicketDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} ticket={selectedTicket} onReply={handleReply} />
            
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-2xl sm:text-3xl font-semibold">จัดการข้อร้องเรียน</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<DocumentTextIcon className="w-8 h-8" />} title="ข้อร้องเรียนทั้งหมด" value={stats.all} />
                    <StatCard icon={<ChatBubbleLeftRightIcon className="w-8 h-8" />} title="รอดำเนินการ" value={stats.pending} />
                    <StatCard icon={<ClockIcon className="w-8 h-8" />} title="กำลังดำเนินการ" value={stats.inProgress} />
                    <StatCard icon={<CheckCircleIcon className="w-8 h-8" />} title="เสร็จสิ้น" value={stats.completed} />
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อผู้ร้อง"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-gray-300"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {filterButtons.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeFilter === filter ? 'bg-gray-800 text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
                    {/* --- Desktop Table --- */}
                    <table className="hidden md:table w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {['หัวข้อ', 'ผู้ร้อง', 'สถานะผู้ใช้', 'วันที่ร้อง', 'สถานะ', 'ตรวจสอบ'].map(header => (
                                    <th 
                                        key={header} 
                                        className={`p-3 font-semibold uppercase tracking-wider ${header === 'ตรวจสอบ' ? 'text-center' : 'text-left'}`}
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="p-3">{ticket.title}</td>
                                    <td className="p-3">{ticket.requester}</td>
                                    <td className="p-3">{ticket.institution}</td>
                                    <td className="p-3">{ticket.submittedAt.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                                    <td className="p-3"><span className={getStatusChip(ticket.status)}>{ticket.status}</span></td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleViewTicket(ticket.id)} className=" transition-colors cursor-pointer">
                                            <EyeIcon className="w-6 h-6" /> 
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* --- Mobile Cards --- */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold pr-4 break-words">{ticket.title}</h3>
                                    <button onClick={() => handleViewTicket(ticket.id)} className="flex-shrink-0   transition-colors cursor-pointer">
                                        <EyeIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-100 text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="">ผู้ร้อง :</span>
                                        <span className="font-medium">{ticket.requester}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="">วันที่ : </span>
                                        <span>{ticket.submittedAt.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="">สถานะ : </span>
                                        <span className={getStatusChip(ticket.status)}>{ticket.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ComplaintManagementPage;
