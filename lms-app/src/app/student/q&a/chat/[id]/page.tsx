"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';

// --- Interface/Type สำหรับข้อความ ---
interface Message {
    id: number;
    sender: 'me' | 'partner';
    text: string;
    timestamp: string;
    status?: 'sending' | 'sent' | 'read';
}

// --- Mock Data ---
const chatPartners = {
    "1": { // ID ของ ริสา บุญนาค
        name: "ริสา บุญนาค",
        role: "ผู้สอน : หลักสูตรภาษาอังกฤษ / คอร์สภาษาอังกฤษเพื่อการค้นคว้าด้านบริการ",
        avatar: "/images/40.png",
    },
    "2": { // ID ของ เอเดน มิลเลอร์
        name: "เอเดน มิลเลอร์",
        role: "ผู้สอน : หลักสูตรภาษาอังกฤษ / คอร์สภาษาอังกฤษเพื่อการค้นคว้าด้านบริการ",
        avatar: "/images/40.png",
    },
    "3": { // ID ของ สมชาย ใจดี
        name: "สมชาย ใจดี",
        role: "ผู้สอน : หลักสูตรภาษาอังกฤษ / คอร์สภาษาอังกฤษเพื่อการค้นคว้าด้านบริการ",
        avatar: "/images/40.png",
    }
};

const initialMessages: Message[] = [
    { id: 1, sender: 'me', text: "อาจาร์ยคะหนูส่งงานไม่ได้ค่ะ หนูกดส่งไปแล้วแต่งานไม่ขึ้นค่ะ", timestamp: "11:02 น.", status: 'read' },
    { id: 2, sender: 'partner', text: "เดี๋ยวอาจารย์ตรวจสอบให้ค่ะ", timestamp: "12:00 น." },
    { id: 3, sender: 'me', text: "นี่คือตัวอย่างข้อความที่ยาวมากๆๆๆๆ เพื่อทดสอบการตัดคำขึ้นบรรทัดใหม่ให้เป็นระเบียบ จะได้ไม่ล้นออกมานอกกรอบข้อความจ้า", timestamp: "12:01 น.", status: 'read' }
];


// --- Main Chat Page Component ---
export default function ChatPage() {
    const searchParams = useSearchParams();
    const instructorId = searchParams.get('instructorId') || "1";
    const isNewChat = searchParams.has('instructorId');

    const chatPartner = chatPartners[instructorId as keyof typeof chatPartners] || chatPartners["1"];

    const [messages, setMessages] = useState<Message[]>(isNewChat ? [] : initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isPartnerTyping]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        const messageId = Date.now();
        const myMessage: Message = {
            id: messageId,
            sender: 'me',
            text: newMessage,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น.",
            status: 'sending'
        };

        setMessages(prev => [...prev, myMessage]);
        setNewMessage("");

        // จำลองกระบวนการส่งและตอบกลับ
        if (!isNewChat) {
            setTimeout(() => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent' } : m)), 1000);
            setTimeout(() => {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
                setIsPartnerTyping(true);
            }, 2500);
            setTimeout(() => {
                setIsPartnerTyping(false);
                const partnerReply: Message = {
                    id: Date.now() + 1,
                    sender: 'partner',
                    text: "รับทราบค่ะ มีปัญหาอะไรเพิ่มเติมไหมคะ",
                    timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + " น.",
                };
                setMessages(prev => [...prev, partnerReply]);
            }, 4500);
        } else {
             setTimeout(() => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'sent' } : m)), 1000);
        }
    };

    return (
        <main className="max-w-4xl mx-auto mt-6 bg-white rounded-xl border-1 border-gray-300 shadow-lg flex flex-col h-[85vh]">
            <header className="flex items-center p-4 border-b rounded-t-xl border-gray-300 sticky top-0 bg-white z-10">
                <Link href="/student/all_notifications" className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={24} className="" /></Link>
                <Image src={chatPartner.avatar} alt={chatPartner.name} width={40} height={40} className="rounded-full object-cover mx-4" />
                <div>
                    <h1 className="font-semibold text-lg">{chatPartner.name}</h1>
                    <p className="text-xs text-gray-600">{chatPartner.role}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length > 0 ? (
                    <>
                        <div className="text-center my-4">
                            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">12/06/2568</span>
                        </div>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2 w-full ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'partner' && <Image src={chatPartner.avatar} alt={chatPartner.name} width={28} height={28} className="rounded-full" />}
                                {msg.sender === 'me' && (
                                    <div className="text-right self-end mb-1">
                                        {msg.status === 'read' && <span className="text-xs text-gray-400">อ่านแล้ว</span>}
                                        {msg.status === 'sent' && <span className="text-xs text-gray-400">ส่งแล้ว</span>}
                                        <p className="text-xs text-gray-600">{msg.timestamp}</p>
                                    </div>
                                )}
                                <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.sender === 'me' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200  rounded-bl-none'}`}>
                                    <p className="break-words">{msg.text}</p>
                                </div>
                                {msg.sender === 'partner' && <p className="text-xs text-gray-600 self-end mb-1">{msg.timestamp}</p>}
                                {msg.sender === 'me' && <Image src="/images/40.png" alt="You" width={28} height={28} className="rounded-full" />}
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="text-center  pt-16">
                        <p>เริ่มต้นการสนทนากับ {chatPartner.name}</p>
                    </div>
                )}

                {isPartnerTyping && (
                    <div className="flex items-end gap-2">
                        <Image src={chatPartner.avatar} alt="typing" width={28} height={28} className="rounded-full" />
                        <div className="p-3 rounded-2xl bg-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-1">
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <footer className="p-4 bg-white border-t rounded-b-xl border-gray-300 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="พิมพ์ข้อความ..." className="flex-1 w-full px-4 py-2 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    <button type="submit" className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 transition-colors" disabled={!newMessage.trim()}><Send size={20} /></button>
                </form>
            </footer>
        </main>
    );
}