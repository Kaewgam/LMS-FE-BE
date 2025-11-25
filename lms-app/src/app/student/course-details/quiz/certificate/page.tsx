'use client';

import React, { useRef } from 'react';
import { FaDownload } from 'react-icons/fa';
import { toPng } from 'html-to-image';
import toast, { Toaster } from 'react-hot-toast';

// --- No changes in this section ---
type TemplateType = 'classic' | 'modern' | 'minimalist';
interface CertificateProps {
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    template: TemplateType;
    primaryColor: string;
    secondaryColor: string;
}
const CertificateDisplay: React.FC<CertificateProps> = ({ studentName, courseName, instructorName, completionDate, template, primaryColor, secondaryColor }) => {
    const text = {
        title: "ใบประกาศนียบัตร",
        presentedTo: "มอบให้ไว้เพื่อแสดงว่า",
        completionMessage: "ได้สำเร็จการศึกษาตามหลักสูตร",
        instructor: "ผู้สอน",
        completionDate: "วันที่สำเร็จการศึกษา",
        leadInstructor: "อาจารย์ผู้สอน",
    };
    return (
        <div className="w-full aspect-[1.414] shadow-lg flex flex-col justify-between items-center transition-all duration-300 p-10" style={{ border: `12px double ${primaryColor}`, backgroundColor: '#ffffffff' }}>
            <div className="text-center">
                <p className="text-2xl font-semibold tracking-widest" style={{ color: secondaryColor }}>{text.title}</p>
                <div className="my-4 w-60 h-1 mx-auto" style={{ backgroundColor: primaryColor }}></div>
                <p className="text-md mt-6" style={{ color: secondaryColor }}>{text.presentedTo}</p>
                <h1 className="text-4xl font-semibold my-6" style={{ color: primaryColor }}>{studentName}</h1>
                <p className="text-md" style={{ color: secondaryColor }}>{text.completionMessage}</p>
                <h2 className="text-2xl font-semibold mt-4" style={{ color: primaryColor }}>{courseName}</h2>
            </div>
            <div className="w-full flex justify-between items-end mt-8" style={{ color: secondaryColor }}>
                <div className="text-center"> <p className="font-semibold text-lg pb-2 border-b-2 " style={{ borderColor: primaryColor }}>{instructorName}</p> <p className="text-sm mt-2">{text.instructor}</p> </div>
                <div className="text-center"> <p className="font-semibold text-lg pb-2 border-b-2" style={{ borderColor: primaryColor }}>{completionDate}</p> <p className="text-sm mt-2">{text.completionDate}</p> </div>
            </div>
        </div>
    );
};

// --- Main Component ---

interface CertificateRecipientPageProps {
    certificateData: CertificateProps;
}

const CertificateRecipientPage: React.FC<CertificateRecipientPageProps> = ({ certificateData }) => {
    const { studentName, courseName } = certificateData;
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        if (!certificateRef.current) {
            toast.error('Could not find the certificate element.');
            return;
        }
        const element = certificateRef.current.querySelector('.w-full.aspect-\\[1\\.414\\]') as HTMLElement;
        if (!element) {
            toast.error('Could not find the certificate display element.');
            return;
        }
        const borderThickness = 12 * 2;
        const actualWidth = element.offsetWidth - borderThickness;
        const actualHeight = element.offsetHeight - borderThickness;
        const options = {
            width: actualWidth,
            height: actualHeight,
            pixelRatio: 1,
            quality: 1.0,
            cacheBust: true,
        };
        const downloadPromise = toPng(element, options)
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `certificate-${studentName.replace(/\s+/g, '-')}-${courseName.replace(/\s+/g, '-')}.png`;
                link.href = dataUrl;
                link.click();
            });

        // This will now use the custom styles
        toast.promise(downloadPromise, {
            loading: 'กำลังสร้างไฟล์ภาพ...',
            success: 'ดาวน์โหลดสำเร็จ!',
            error: 'เกิดข้อผิดพลาดในการดาวน์โหลด',
        });
    };

    return (
        <>
            {/* ▼▼▼▼▼ CODE ADDED HERE ▼▼▼▼▼ */}
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    // Default styles for all toasts
                    style: {
                        borderRadius: '8px',
                        background: '#333',
                        color: '#fff',
                        fontSize: '16px',
                        padding: '16px 24px',
                        fontWeight: '600',
                    },
                    // Success (Green) alert styles
                    success: {
                        style: {
                            background: '#F0FDF4',
                            color: 'black',
                        },
                        iconTheme: {
                            primary: '#22C55E',
                            secondary: 'white',
                        },
                    },
                    // Error (Red) alert styles
                    error: {
                        style: {
                            background: '#FFF1F2',
                            color: 'black',
                        },
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: 'white',
                        },
                    },
                }}
            />
            {/* ▲▲▲▲▲ CODE ADDED HERE ▲▲▲▲▲ */}

            <div className="min-h-screen  flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <main className="w-full max-w-5xl mx-auto space-y-8">
                    <div className="overflow-x-auto py-2">
                        <div ref={certificateRef} className="w-3xl mx-auto">
                            <CertificateDisplay {...certificateData} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <ActionButton icon={<FaDownload />} onClick={handleDownload}>
                            ดาวน์โหลดเป็นรูปภาพ
                        </ActionButton>
                    </div>
                </main>
            </div>
        </>
    );
};

// --- No changes in this section ---
const ActionButton: React.FC<{ icon: React.ReactNode; onClick: () => void; children: React.ReactNode }> = ({ icon, onClick, children }) => ( <button onClick={onClick} className="w-full sm:w-auto flex items-center justify-center gap-3 py-3 px-8 bg-[#414E51]  text-white font-semibold rounded-full hover:bg-[#2b3436] transition-all text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5" > {icon} {children} </button> );
const CertificatePage = () => { const sampleCertificateData: CertificateProps = { studentName: 'น้ำพริก กะปิ', courseName: 'การพัฒนาเว็บแอปพลิเคชันขั้นสูง', instructorName: 'กิ่งฟ้า คล้ายสวน', completionDate: '28 สิงหาคม 2568', template: 'modern', primaryColor: '#1e40af', secondaryColor: '#334155', }; return <CertificateRecipientPage certificateData={sampleCertificateData} />; };
export default CertificatePage;