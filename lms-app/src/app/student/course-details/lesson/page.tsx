'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiClock, FiUsers, FiPaperclip, FiMoreHorizontal, FiSend, FiPlus, FiDownload, FiX, FiLock } from 'react-icons/fi';

// --- Type Definitions ---
interface Comment { id: number; author: { name: string; role: 'นักเรียน' | 'ผู้สอน'; avatar: string; }; timestamp: string; text: string; replies: Comment[]; }
interface CommentForRender { comment: Comment; level: number; }
interface Lesson { chapter: number; title: string; videoUrl?: string; durationInMinutes: number; studentCount: number; }
interface Assignment { title: string; dueDate: string | null; instructions: string[]; groupWork: string | null; attachedFile: string | null; }

// --- ข้อมูลเริ่มต้น (จำลอง 3 รูปแบบ) ---
const allLessonsData = [
    { chapter: 1, title: 'Data Visualization คืออะไร', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 5, studentCount: 30 },
    { chapter: 2, title: 'ประโยชน์ Data Visualization', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 8, studentCount: 30 },
    { chapter: 3, title: 'การนำ Data Visualization ไปใช้งาน', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 12, studentCount: 30 },
    { chapter: 4, title: 'หลักการออกแบบ Dashboard ที่ดี', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 15, studentCount: 30 },
    { chapter: 5, title: 'Workshop: สร้าง Dashboard ด้วย Google Looker Studio', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 25, studentCount: 30 },
    { chapter: 6, title: 'การเลือกใช้กราฟให้เหมาะกับข้อมูล', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 18, studentCount: 30 },
    { chapter: 7, title: 'Case Study: การใช้ Data Visualization ในธุรกิจจริง', videoUrl: 'https://www.youtube.com/embed/14OBXAjgj7U', durationInMinutes: 22, studentCount: 30 },
];
const assignmentData_NoAssignment: Assignment = { title: 'ยังไม่มีงานมอบหมาย', dueDate: null, instructions: [], groupWork: null, attachedFile: null };
const assignmentData_InProgress: Assignment = { title: 'วิเคราะห์และนำเสนอข้อมูลด้วยแผนภูมิ', dueDate: 'กำหนด 28 สิงหาคม 2025, 11:59 PM', instructions: ['เลือก Dataset ที่สนใจ', 'สร้าง Dashboard เพื่อนำเสนอ Insight'], groupWork: 'การทำงานกลุ่ม: กลุ่มละ 3-4 คน', attachedFile: 'mid-term-brief.pdf' };
const assignmentData_PastDue: Assignment = { title: 'วิเคราะห์และนำเสนอข้อมูลด้วยแผนภูมิ 2', dueDate: 'กำหนด 10 กรกฎาคม 2025, 11:59 PM', instructions: ['แก้ไขคำถาม', 'แก้ไขรูปภาพ'], groupWork: 'การทำงานกลุ่ม: กลุ่มละ 2 คน', attachedFile: 'assignment-01.pdf' };
const fileAttachments = [{ name: 'TALKA_202305_ContentDI-02.pdf', type: 'File PDF' }];
const initialCommentData: Comment[] = [ { id: 1, author: { name: 'สมชาย ใจดี', role: 'นักเรียน', avatar: '/images/40.png' }, timestamp: '5 ชั่วโมงที่แล้ว', text: 'อาจารย์ครับ ไม่เข้าใจตรงส่วนของการเลือกใช้กราฟแต่ละประเภทครับ มีแหล่งข้อมูลเพิ่มเติมแนะนำไหมครับ?', replies: [ { id: 2, author: { name: 'อ.วิทวัส เก่งมาก', role: 'ผู้สอน', avatar: '/images/40.png' }, timestamp: '4 ชั่วโมงที่แล้ว', text: 'เป็นคำถามที่ดีครับสมชาย ลองดูบทความนี้เพิ่มเติมนะครับ น่าจะช่วยให้เห็นภาพมากขึ้น: https://bit.ly/dataviz-charts', replies: [] }, ] }, ];
const currentUser = { name: 'เราเอง', role: 'นักเรียน', avatar: '/images/40.png' } as const;

// --- Helper Components ---
const parseDueDate = (dueDateString: string | null): Date | null => { if (!dueDateString) return null; try { const thaiMonths: { [key: string]: number } = { 'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7, 'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11 }; const cleanedString = dueDateString.replace('กำหนด ', ''); const parts = cleanedString.split(', '); const dateParts = parts[0].split(' '); const timeParts = parts[1].split(' ')[0].split(':'); const ampm = parts[1].split(' ')[1]; const day = parseInt(dateParts[0], 10); const month = thaiMonths[dateParts[1]]; const year = parseInt(dateParts[2], 10); let hour = parseInt(timeParts[0], 10); const minute = parseInt(timeParts[1], 10); if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12; if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0; return new Date(year, month, day, hour, minute); } catch (error) { console.error("Error parsing due date:", error); return null; } };
interface AssignmentStatusProps { isSubmitted: boolean; dueDate: Date | null; submissionDate: Date | null; }
const AssignmentStatus: React.FC<AssignmentStatusProps> = ({ isSubmitted, dueDate, submissionDate }) => { const now = new Date(); const isPastDue = dueDate ? now > dueDate : false; if (isSubmitted) { const submittedLate = dueDate && submissionDate ? submissionDate > dueDate : false; if (submittedLate) { return <span className="text-sm font-semibold text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full">ส่งเลยกำหนด</span>; } return <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">ส่งแล้ว</span>; } if (isPastDue) { return <span className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">ยังไม่ได้ส่ง</span>; } return <span className="text-sm font-semibold  bg-gray-100 px-3 py-1 rounded-full">ยังไม่ได้ส่ง</span>; };
interface ReplyInputProps { onSubmit: (text: string) => void; onCancel: () => void; }
const ReplyInput: React.FC<ReplyInputProps> = ({ onSubmit, onCancel }) => { const [text, setText] = useState(''); const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) { onSubmit(text); setText(''); } }; return ( <form onSubmit={handleSubmit} className="flex items-start gap-3 mt-3"> <img src={currentUser.avatar} alt="You" className="w-9 h-9 rounded-full mt-1" /> <div className="flex-1"> <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="เขียนตอบกลับ..." className="w-full border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" autoFocus /> <div className="flex items-center gap-2 mt-2"> <button type="submit" className="text-sm bg-blue-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-700">ส่ง</button> <button type="button" onClick={onCancel} className="text-sm bg-slate-100 text-slate-700 font-semibold py-1 px-3 rounded-md hover:bg-slate-200">ยกเลิก</button> </div> </div> </form> ); };
interface CommentItemProps { comment: Comment; level: number; activeReplyId: number | null; onSetReplyId: (id: number | null) => void; onAddReply: (parentId: number, text: string) => void; }
const CommentItem: React.FC<CommentItemProps> = ({ comment, level, activeReplyId, onSetReplyId, onAddReply }) => { const isReplying = activeReplyId === comment.id; const handleReplySubmit = (text: string) => { onAddReply(comment.id, text); onSetReplyId(null); }; const MAX_INDENT_LEVEL = 2; const PADDING_PER_LEVEL = 44; const indentPadding = Math.min(level, MAX_INDENT_LEVEL) * PADDING_PER_LEVEL; return ( <div style={{ paddingLeft: `${indentPadding}px` }}> <div className="flex items-start gap-4"> <img src={comment.author.avatar} alt={comment.author.name} className="w-10 h-10 rounded-full flex-shrink-0 mt-1" /> <div className="flex-1"> <div className="flex items-center gap-2 flex-wrap"> <p className="font-semibold text-slate-800">{comment.author.name}</p> {comment.author.role === 'ผู้สอน' && <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">ผู้สอน</span>} <span className="text-xs text-slate-400">• {comment.timestamp}</span> </div> <p className="mt-1 text-slate-700 break-words">{comment.text}</p> <button onClick={() => onSetReplyId(isReplying ? null : comment.id)} className="mt-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"> {isReplying ? 'ยกเลิก' : 'ตอบกลับ'} </button> {isReplying && <ReplyInput onSubmit={handleReplySubmit} onCancel={() => onSetReplyId(null)} />} </div> </div> </div> ); };

// --- Main Component: LessonPage ---
const LessonPage: React.FC = () => {
    const [lessonData, setLessonData] = useState<Lesson | null>(null);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
    const [isCourseUnlocked, setIsCourseUnlocked] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [submissionDate, setSubmissionDate] = useState<Date | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [comments, setComments] = useState<Comment[]>(initialCommentData);
    const [newCommentText, setNewCommentText] = useState('');
    const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
    
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const lessonId = searchParams.get('lessonId');
        const unlockedParam = searchParams.get('isUnlocked');
        setIsCourseUnlocked(unlockedParam === 'true');
        if (lessonId) {
            const id = parseInt(lessonId, 10);
            const foundLesson = allLessonsData.find(l => l.chapter === id);
            setLessonData(foundLesson || null);
            if (id <= 2) { setCurrentAssignment(assignmentData_NoAssignment); } 
            else if (id <= 6) { setCurrentAssignment(assignmentData_InProgress); } 
            else { setCurrentAssignment(assignmentData_PastDue); }
        } else {
            setLessonData(allLessonsData[0]);
            setCurrentAssignment(assignmentData_NoAssignment);
        }
    }, [searchParams]);

    const dueDate = useMemo(() => parseDueDate(currentAssignment?.dueDate || null), [currentAssignment]);
    
    const getCommentsForRender = (commentList: Comment[], initialLevel = 0): CommentForRender[] => { const result: CommentForRender[] = []; const traverse = (list: Comment[], currentLevel: number) => { for (const comment of list) { result.push({ comment, level: currentLevel }); if (comment.replies && comment.replies.length > 0) { traverse(comment.replies, currentLevel + 1); } } }; traverse(commentList, initialLevel); return result; };
    const commentsForRender = useMemo(() => getCommentsForRender(comments), [comments]);
    const totalComments = commentsForRender.length;
    const handleAddComment = () => { if (newCommentText.trim() === '') return; const newComment: Comment = { id: Date.now(), author: currentUser, timestamp: 'เมื่อสักครู่', text: newCommentText, replies: [] }; setComments(prevComments => [...prevComments, newComment]); setNewCommentText(''); };
    const handleAddReply = (parentId: number, text: string) => { const newReply: Comment = { id: Date.now(), author: currentUser, timestamp: 'เมื่อสักครู่', text: text, replies: [] }; const addReplyToComment = (commentList: Comment[]): Comment[] => { return commentList.map(comment => { if (comment.id === parentId) return { ...comment, replies: [...comment.replies, newReply] }; if (comment.replies.length > 0) return { ...comment, replies: addReplyToComment(comment.replies) }; return comment; }); }; setComments(prevComments => addReplyToComment(prevComments)); setActiveReplyId(null); };
    const handleAttachClick = () => { if (fileInputRef.current) { fileInputRef.current.click(); } };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files) { const files = Array.from(event.target.files); if (files.length > 0) { setUploadedFiles(prevFiles => [...prevFiles, ...files]); } event.target.value = ''; } };
    const handleRemoveFile = (fileIndex: number) => { setUploadedFiles(prevFiles => prevFiles.filter((_, index) => index !== fileIndex)); };
    const handleSubmit = () => { if (uploadedFiles.length > 0) { console.log('Submitting files:', uploadedFiles.map(f => f.name)); setSubmissionDate(new Date()); setIsSubmitted(true); } else { alert('กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์ก่อนส่งงาน'); } };
    const handleUnsubmit = () => { setIsSubmitted(false); setSubmissionDate(null); };

    if (!lessonData || !currentAssignment) {
        return <div className="flex justify-center items-center h-screen bg-slate-50">กำลังโหลดข้อมูลบทเรียน...</div>;
    }

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div className="grid grid-cols-12 gap-x-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100"> <h1 className="text-3xl font-bold text-slate-900">{lessonData.title}</h1> <p className="text-lg text-slate-600 mt-1">บทที่ {lessonData.chapter}</p> <div className="flex items-center gap-6 text-sm text-slate-500 mt-4 pt-4 border-t border-slate-200"> <div className="flex items-center gap-2"><FiClock /><span>{lessonData.durationInMinutes} นาที</span></div> <div className="flex items-center gap-2"><FiUsers /><span>{lessonData.studentCount} ผู้เรียน</span></div> </div> </div>
                    <div className="aspect-video"> <iframe className="w-full h-full rounded-xl shadow-lg shadow-slate-300/30 border border-slate-200" src={lessonData.videoUrl} title={lessonData.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe> </div>
                    <div className="bg-white p-6 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100"> <h2 className="text-xl font-bold text-slate-900 mb-4">ไฟล์ประกอบการเรียน</h2> <div className="border border-slate-200 rounded-lg p-3 flex items-center justify-between transition-all duration-300 hover:bg-slate-50 hover:shadow-inner hover:shadow-slate-100"> <div className="flex items-center gap-4"> <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center border border-blue-100"><FiPaperclip size={24}/></div> <div> <p className="font-semibold text-slate-800">{fileAttachments[0].name}</p> <p className="text-sm text-slate-500">{fileAttachments[0].type}</p> </div> </div> <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full"><FiMoreHorizontal /></button> </div> <button className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-blue-500/20"> <FiDownload/><span>ดาวน์โหลดทั้งหมด</span> </button> </div>
                    <div className="bg-white p-6 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100"> <h2 className="text-xl font-bold text-slate-900 mb-5">แสดงความคิดเห็น ({totalComments})</h2> <div className="flex items-start gap-4"> <img src={currentUser.avatar} alt="Your avatar" className="w-10 h-10 rounded-full"/> <div className="relative flex-1"> <input type="text" placeholder="ถามคำถามหรือแชร์ความคิดเห็นของคุณ..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} className="w-full border border-slate-300 rounded-lg py-3 pl-4 pr-12 text-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" /> <button onClick={handleAddComment} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-blue-600 transition-colors"><FiSend /></button> </div> </div> <div className="my-8 border-t border-slate-200"></div> <div className="space-y-6"> {commentsForRender.map(({ comment, level }) => ( <CommentItem  key={comment.id}  comment={comment}  level={level} activeReplyId={activeReplyId} onSetReplyId={setActiveReplyId} onAddReply={handleAddReply} /> ))} </div> </div>
                </div>

                <div className={`col-span-12 lg:col-span-4 mt-8 lg:mt-0 transition-opacity duration-500 ${!isCourseUnlocked ? 'opacity-50' : ''}`}>
                    <div className={`bg-white p-6 rounded-xl shadow-lg shadow-slate-200/70 border border-slate-200 sticky top-10 ${!isCourseUnlocked ? 'pointer-events-none' : ''}`}>
                        
                        {!isCourseUnlocked && ( <div className="absolute inset-0 bg-slate-100/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10"> <FiLock className="text-slate-500 w-12 h-12 mb-4" /> <p className="font-bold text-slate-600">ปลดล็อกคอร์สเพื่อส่งงาน</p> </div> )}

                        {currentAssignment.title === 'ยังไม่มีงานมอบหมาย' ? (
                            <div className="text-center py-10">
                                <h3 className="text-xl font-bold text-slate-900">{currentAssignment.title}</h3>
                                <p className="text-sm text-slate-500 mt-2">ยังไม่มีงานสำหรับบทเรียนนี้</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-end">
                                    <AssignmentStatus isSubmitted={isSubmitted} dueDate={dueDate} submissionDate={submissionDate} />
                                </div>
                                <div className="mt-2">
                                    <h3 className="text-[18px] font-bold text-slate-900">{currentAssignment.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{currentAssignment.dueDate}</p>
                                </div>
                                
                                <div className="mt-5 pt-5 border-t border-slate-200 space-y-3 text-sm">
                                    <p className="font-semibold text-slate-700">รายละเอียด</p>
                                    <ul className="list-inside list-disc pl-2 text-slate-600 space-y-1">
                                        {currentAssignment.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                                    </ul>
                                    <p className="text-slate-600 !mt-4">{currentAssignment.groupWork}</p>
                                </div>
                                <div className="mt-5 pt-5 border-t border-slate-200">
                                    <p className="font-semibold text-sm mb-2 text-slate-700">เอกสารแนบ</p>
                                    <div className="border border-slate-200 rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                                        <img src="https://i.imgur.com/2sH4VcG.png" alt="PDF icon" className="w-4 h-4"/>
                                        <span className="text-sm text-slate-600 truncate">{currentAssignment.attachedFile}</span>
                                    </div>
                                </div>
                                <div className="mt-5 pt-5 border-t border-slate-200">
                                    <p className="font-semibold text-slate-700 mb-3">งานของคุณ</p>
                                    <div className="space-y-2 mb-4">
                                        {/* --- [แก้ไข] ส่วนของการแสดงไฟล์ที่อัปโหลด --- */}
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="border border-slate-200 bg-slate-50 rounded-lg p-2.5 flex items-center justify-between">
                                                <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 truncate min-w-0">
                                                    <FiPaperclip className="text-slate-500 flex-shrink-0"/>
                                                    <span className="text-sm text-gray-600 font-medium truncate hover:underline" title={file.name}>
                                                        {file.name}
                                                    </span>
                                                </a>
                                                {!isSubmitted && ( <button onClick={() => handleRemoveFile(index)} className="text-slate-400 hover:text-red-500 p-1 rounded-full flex-shrink-0"><FiX /></button> )}
                                            </div>
                                        ))}
                                    </div>
                                    {!isSubmitted ? ( <> <div className="flex items-center gap-2 mb-4"> <button onClick={handleAttachClick} className="w-full flex items-center justify-center gap-2 text-blue-600 bg-blue-100/50 border border-blue-200/50 font-semibold text-sm p-2.5 rounded-md hover:bg-blue-100 transition-colors"> <FiPlus/><span>แนบไฟล์</span> </button> </div> <button onClick={handleSubmit} disabled={uploadedFiles.length === 0} className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 disabled:shadow-none" > ส่งงาน </button> </> ) : ( <button onClick={handleUnsubmit} className="w-full bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-700 transition-all" > ยกเลิกการส่ง </button> )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LessonPage;