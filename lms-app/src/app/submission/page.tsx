'use client';

import React from 'react';
import { MoreVertical } from 'lucide-react';
import { useSearchParams, notFound } from 'next/navigation';

const assignmentData = {
    title: 'วิเคราะห์และนำเสนอข้อมูลด้วยแผนภูมิ',
    dueDate: '21 กรกฎาคม, 2025 11:59 PM',
    dueDateISO: '2025-07-10T23:59:00', 
    details: {
        intro: 'จงทำตามคำสั่งต่อไปนี้',
        steps: ['1.จงเติมคำตอบ', '2.จงใส่รูปภาพ'],
        teamInfo: 'การทำงาน : กลุ่ม 2 คน'
    },
    referenceFile: {
        name: 'TALKA_202305_Content01-02.pdf',
        type: 'File PDF',
        thumbnailUrl: 'https://i.imgur.com/3fH1N5a.png'
    }
};

const studentSubmissionsData = [
    { id: 1, studentId: '00000001', name: 'ส้มตำ ไก่ย่าง', submission: { submittedDateISO: '2025-07-09T18:30:00', submittedDate: '9 กรกฎาคม, 2025 11:59 PM', file: { name: 'Assignment 1.pdf' } } },
    { id: 2, studentId: '00000002', name: 'ข้าวเหนียว หมูทอด', submission: null },
    { id: 3, studentId: '00000003', name: 'กิ่งฟ้า คล้ายสวน', submission: { submittedDateISO: '2025-07-11T09:00:00', submittedDate: '22 กรกฎาคม, 2025 09:00 AM', file: { name: 'kingfa_analysis.pdf' } } }
];

type FileCardProps = {
    file: { name: string; type: string; thumbnailUrl: string; }
};

const FileCard: React.FC<FileCardProps> = ({ file }) => (
    <div className="border border-slate-200 bg-slate-50 rounded-lg p-3 max-w-md flex items-center justify-between hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
            <img src={file.thumbnailUrl} alt="File Thumbnail" className="w-10 h-12 object-cover rounded" />
            <div>
                <p className="font-semibold  text-sm">{file.name}</p>
                <p className="text-xs text-gray-600">{file.type}</p>
            </div>
        </div>
        <button className="text-gray-400 hover:text-gray-700 p-2">
            <MoreVertical size={20} />
        </button>
    </div>
);

const SubmissionPage = () => {
    const searchParams = useSearchParams();
    const studentId = searchParams.get('id');

    if (!studentId) {
        return notFound();
    }

    const student = studentSubmissionsData.find(s => s.id === parseInt(studentId, 10));

    if (!student) {
        return notFound();
    }

    const getStatusInfo = () => {
        if (!student.submission) {
            return { text: 'ยังไม่ได้ส่ง', color: 'bg-red-100 text-red-900 ' , };
        }
        const submissionDate = new Date(student.submission.submittedDateISO);
        const dueDate = new Date(assignmentData.dueDateISO);
        if (submissionDate > dueDate) {
            return { text: 'เลยกำหนดส่ง', color: 'bg-yellow-100 text-yellow-900' };
        }
        return { text: 'ส่งแล้ว', color: 'bg-green-100 text-green-900' };
    };

    const statusInfo = getStatusInfo();
    const submittedDate = student.submission ? student.submission.submittedDate : 'N/A';
    const submittedFile = student.submission?.file;

    return (
        <div className="max-w-7xl mx-auto mt-8 mb-16 bg-white p-4 sm:p-6 lg:p-10 border border-gray-300 rounded-2xl shadow-lg">
            {/* --- ปรับ Header ให้ stack บนจอเล็ก (flex-col) และเป็นแนวนอนบนจอใหญ่ (sm:flex-row) --- */}
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6 mb-10">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold  mb-2">{assignmentData.title}</h1>
                    <div className="space-y-1 text-sm sm:text-base text-gray-600">
                        <p>กำหนดส่ง : {assignmentData.dueDate}</p>
                        <p>รหัสนักศึกษา : {student.studentId}</p>
                        <p>ชื่อ - สกุล : {student.name}</p>
                        {student.submission && <p>ส่งเมื่อ : {submittedDate}</p>}
                    </div>
                </div>
                <div className={`px-5 py-2 text-sm sm:text-base rounded-full shrink-0 ${statusInfo.color}`}>
                    {statusInfo.text}
                </div>
            </header>

            <section className="mb-10">
                <h2 className="text-xl font-semibold  mb-4">รายละเอียด</h2>
                <div className="text-gray-700 text-base leading-relaxed space-y-2">
                    <p>{assignmentData.details.intro}</p>
                    {assignmentData.details.steps.map((step, index) => (
                        <p key={index}>{step}</p>
                    ))}
                    <p className="pt-2 font-medium ">{assignmentData.details.teamInfo}</p>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-xl font-semibold  mb-4">เอกสารอ้างอิง (optional)</h2>
                <FileCard file={assignmentData.referenceFile} />
            </section>

            <section>
                <h2 className="text-xl font-semibold  mb-4">งานที่ส่ง</h2>
                {student.submission && submittedFile ? (
                    <FileCard file={{
                        name: submittedFile.name,
                        type: 'File PDF',
                        thumbnailUrl: 'https://i.imgur.com/3fH1N5a.png'
                    }} />
                ) : (
                    <div className="bg-gray-50 text-gray-600 p-4 rounded-lg text-center">
                        <p>นักเรียนคนนี้ยังไม่ได้ส่งงาน</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default SubmissionPage;