'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// [เพิ่ม] import ไอคอนสำหรับ Modal ใหม่
import { FaChevronLeft, FaTimes, FaCheck, FaSadTear, FaTrophy } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

// ... Interfaces, mockQuizData, correctAnswers ไม่มีการเปลี่ยนแปลง ...
// Interfaces (โครงสร้างข้อมูล)
interface Choice {
    id: number;
    text: string;
}
type QuestionType = 'multiple-choice' | 'multiple-response' | 'true-false' | 'fill-in-the-blank' | 'sequencing' | 'matching';
interface Question {
    id: number;
    type: QuestionType;
    title: string;
    choices: Choice[];
    textParts: string[];
    optionsForMatching?: string[];
}
interface QuizData {
    title: string;
    questions: Question[];
}

// ข้อมูลแบบทดสอบตัวอย่าง
const mockQuizData: QuizData = {
    title: 'แบบทดสอบท้ายบทเรียน',
    questions: [
        { id: 1, type: 'multiple-choice', title: 'ข้อใดต่อไปนี้เป็นหน้าที่ของรากพืช', choices: [ { id: 101, text: 'ป้องกันศัตรูพืช' }, { id: 102, text: 'สังเคราะห์แสง' }, { id: 103, text: 'ลำเลียงอาหาร' }, { id: 104, text: 'ดูดน้ำและแร่ธาตุจากดิน' } ], textParts: [] },
        { id: 3, type: 'true-false', title: 'การที่พืชออกดอกในช่วงฤดูร้อนเป็นการตอบสนองต่อแสงและอุณหภูมิของสิ่งแวดล้อม', choices: [ { id: 301, text: 'ถูก' }, { id: 302, text: 'ผิด' } ], textParts: [] },
        { id: 4, type: 'fill-in-the-blank', title: 'เติมคำตอบในช่องว่างให้สมบูรณ์', choices: [], textParts: ['ในเซลล์พืชจะมี', 'ซึ่งมีสารสีเขียวที่เรียกว่า', 'ทำหน้าที่สังเคราะห์แสง'] },
        { id: 5, type: 'multiple-response', title: 'ข้อใดเป็นการเปลี่ยนแปลงทางเคมี (เลือกได้มากกว่า 1 คำตอบ)', choices: [ { id: 501, text: 'น้ำแข็งละลาย' }, { id: 502, text: 'การเผากระดาษ' }, { id: 503, text: 'เหล็กเกิดสนิม' }, { id: 504, text: 'น้ำระเหย' } ], textParts: [] },
        { id: 6, type: 'sequencing', title: 'จงเรียงลำดับขั้นตอนของกระบวนการย่อยอาหารในร่างกายมนุษย์', choices: [ { id: 601, text: 'กระเพาะอาหาร' }, { id: 602, text: 'ปาก' }, { id: 603, text: 'ลำไส้เล็ก' }, { id: 604, text: 'หลอดอาหาร' } ], textParts: [] },
        { id: 7, type: 'matching', title: 'จงจับคู่ส่วนประกอบของพืชกับหน้าที่ให้ถูกต้อง', choices: [ { id: 701, text: 'ใบ' }, { id: 702, text: 'ลำต้น' }, { id: 703, text: 'ราก' } ], optionsForMatching: ['ดูดน้ำและแร่ธาตุ', 'สังเคราะห์แสง', 'ลำเลียงน้ำและอาหาร'], textParts: [] },
    ]
};

// ข้อมูลเฉลยสำหรับแต่ละคำถาม
const correctAnswers: Record<number, any> = {
    1: 'ดูดน้ำและแร่ธาตุจากดิน',
    3: 'ถูก',
    4: ['คลอโรพลาสต์', 'คลอโรฟิลล์'],
    5: ['การเผากระดาษ', 'เหล็กเกิดสนิม'],
    6: ['ปาก', 'หลอดอาหาร', 'กระเพาะอาหาร', 'ลำไส้เล็ก'],
    7: {
        701: 'สังเคราะห์แสง',
        702: 'ลำเลียงน้ำและอาหาร',
        703: 'ดูดน้ำและแร่ธาตุ'
    }
};


// Component สำหรับแสดง Modal เมื่อสอบไม่ผ่าน
const FailModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-in fade-in-25 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center max-w-md w-full transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <FaSadTear className="text-7xl text-amber-500 mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">ยังไม่ผ่านการทดสอบ</h2>
                <p className="text-slate-600 mb-8">
                    น่าเสียดาย! คุณยังทำคะแนนไม่ถึงเกณฑ์ที่กำหนด
                    <br />
                    พยายามอีกครั้งเพื่อรับใบประกาศนียบัตรนะ
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 active:bg-indigo-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200"
                >
                    พยายามอีกครั้ง
                </button>
            </div>
        </div>
    );
};

// --- [เพิ่ม] Component สำหรับแสดง Modal เมื่อสอบผ่าน ---
const PassModal = ({ score, totalQuestions, onNavigate }: { score: number, totalQuestions: number, onNavigate: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-in fade-in-25 duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center max-w-md w-full transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <FaTrophy className="text-7xl text-green-500 mx-auto mb-5" />
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">ยินดีด้วย! คุณผ่านการทดสอบ</h2>
                <p className="text-slate-600 mb-8">
                    คุณทำคะแนนได้ <span className="font-bold text-green-600">{score}</span> จาก {totalQuestions} คะแนน
                    <br />
                    คุณได้รับสิทธิ์ในการรับใบประกาศนียบัตร
                </p>
                <button
                    onClick={onNavigate}
                    className="w-full px-8 py-3 bg-teal-500 text-white font-bold rounded-full hover:bg-teal-600 active:bg-teal-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200"
                >
                    ไปที่หน้ารับใบประกาศนียบัตร
                </button>
            </div>
        </div>
    );
};


const StudentQuizPage = () => {
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
    const [selectedMatchingOption, setSelectedMatchingOption] = useState<string | null>(null);
    const [showFailModal, setShowFailModal] = useState(false);
    // [เพิ่ม] State สำหรับ Modal สอบผ่าน และคะแนน
    const [showPassModal, setShowPassModal] = useState(false);
    const [finalScore, setFinalScore] = useState(0);

    const router = useRouter();

    // ... useEffect และฟังก์ชันอื่นๆ เหมือนเดิม ...
    useEffect(() => {
        setQuiz(mockQuizData);
        const initialAnswers: Record<number, any> = {};
        mockQuizData.questions.forEach(q => {
            if (q.type === 'sequencing') {
                 initialAnswers[q.id] = [];
            } else if (q.type === 'matching') {
                 initialAnswers[q.id] = {};
            } else if (q.type === 'fill-in-the-blank') {
                initialAnswers[q.id] = Array(q.textParts.length - 1).fill('');
            } else if (q.type === 'multiple-response') {
                initialAnswers[q.id] = [];
            } else {
                initialAnswers[q.id] = null;
            }
        });
        setUserAnswers(initialAnswers);
    }, []);

    useEffect(() => {
        setSelectedMatchingOption(null);
    }, [currentPage]);

    if (!quiz) {
        return <div className="flex justify-center items-center h-screen bg-slate-100">กำลังโหลดแบบทดสอบ...</div>;
    }

    const currentQuestion = quiz.questions[currentPage];
    const totalQuestions = quiz.questions.length;
    const progressPercentage = ((currentPage + 1) / totalQuestions) * 100;

    const handleAnswerChange = (questionId: number, answer: any) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    };
    const handleSequenceSelect = (choiceText: string) => {
        const currentSequence = userAnswers[currentQuestion.id] || [];
        const newSequence = [...currentSequence, choiceText];
        handleAnswerChange(currentQuestion.id, newSequence);
    };
    const handleSequenceRemove = (indexToRemove: number) => {
        const currentSequence = userAnswers[currentQuestion.id] || [];
        const newSequence = currentSequence.filter((_: any, index: number) => index !== indexToRemove);
        handleAnswerChange(currentQuestion.id, newSequence);
    };
    const handleMatchingClick = (promptId: number) => {
        const currentAnswers = userAnswers[currentQuestion.id] || {};
        const nextAnswers = { ...currentAnswers };
        if (nextAnswers[promptId]) {
            delete nextAnswers[promptId];
            setSelectedMatchingOption(null);
        }
        else if (selectedMatchingOption) {
            const isAlreadyPlaced = Object.values(nextAnswers).includes(selectedMatchingOption);
            if (!isAlreadyPlaced) {
                nextAnswers[promptId] = selectedMatchingOption;
                setSelectedMatchingOption(null);
            }
        }
        handleAnswerChange(currentQuestion.id, nextAnswers);
    };

    const goToNext = () => currentPage < totalQuestions - 1 && setCurrentPage(prev => prev + 1);
    const goToPrev = () => currentPage > 0 && setCurrentPage(prev => prev - 1);

    const isQuestionAnswered = (question: Question, answer: any): boolean => {
        switch (question.type) {
            case 'multiple-choice':
            case 'true-false':
                return answer !== null && answer !== undefined && answer !== '';
            case 'multiple-response':
                return Array.isArray(answer) && answer.length > 0;
            case 'sequencing':
                return Array.isArray(answer) && answer.length === question.choices.length;
            case 'matching':
                return typeof answer === 'object' && answer !== null && Object.keys(answer).length === question.choices.length;
            case 'fill-in-the-blank':
                const blanksLength = question.textParts.length - 1;
                return Array.isArray(answer) && answer.length === blanksLength && answer.every(part => part.trim() !== '');
            default:
                return false;
        }
    };


    // --- [แก้ไข] ฟังก์ชัน handleSubmit อีกครั้ง ---
    const handleSubmit = () => {
        const firstUnansweredIndex = quiz.questions.findIndex(q => !isQuestionAnswered(q, userAnswers[q.id]));

        if (firstUnansweredIndex !== -1) {
            toast.error(`กรุณาตอบคำถามข้อ ${firstUnansweredIndex + 1} ให้ครบถ้วน`);
            setCurrentPage(firstUnansweredIndex);
            return;
        }

        let score = 0;
        quiz.questions.forEach(question => {
            const userAnswer = userAnswers[question.id];
            const correctAnswer = correctAnswers[question.id];
            let isCorrect = false;

            switch (question.type) {
                case 'multiple-choice':
                case 'true-false':
                    isCorrect = userAnswer === correctAnswer;
                    break;
                case 'multiple-response':
                    isCorrect = userAnswer.length === correctAnswer.length && userAnswer.every((ans: string) => correctAnswer.includes(ans));
                    break;
                case 'fill-in-the-blank':
                case 'sequencing':
                    isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
                    break;
                case 'matching':
                    isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
                    break;
            }

            if (isCorrect) {
                score++;
            }
        });

        const passingScore = Math.ceil((2 / 3) * totalQuestions);

        // [จุดที่แก้ไข]
        if (score >= passingScore) {
            // สอบผ่าน: แสดง Pass Modal
            setFinalScore(score); // เก็บคะแนนเพื่อนำไปแสดง
            setShowPassModal(true); // เปิด Modal
        } else {
            // สอบไม่ผ่าน: แสดง Fail Modal
            setShowFailModal(true);
        }
    };

    // ... โค้ดส่วน renderQuestion และ getQuestionTypeDisplayName เหมือนเดิม ...
    const getQuestionTypeDisplayName = (type: QuestionType): string => {
        switch (type) {
            case 'multiple-choice': return 'ปรนัย (เลือกตอบข้อเดียว)';
            case 'multiple-response': return 'ปรนัย (เลือกตอบหลายข้อ)';
            case 'true-false': return 'คำถามถูก-ผิด';
            case 'fill-in-the-blank': return 'เติมคำในช่องว่าง';
            case 'sequencing': return 'เรียงลำดับ';
            case 'matching': return 'จับคู่';
            default: return 'แบบทดสอบ';
        }
    };
    const renderQuestion = (question: Question) => {
        const answers = userAnswers[question.id];
        
        const baseChoiceClass = "p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4 text-slate-700 font-medium";
        const hoverChoiceClass = "hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5";
        const selectedChoiceClass = "border-indigo-600 bg-indigo-50 shadow-md";

        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            return ( <div className="flex flex-col gap-4 mt-8"> {question.choices.map(choice => ( <label key={choice.id} className={`${baseChoiceClass} ${answers === choice.text ? selectedChoiceClass : 'border-slate-200 '+hoverChoiceClass}`}> <input type="radio" name={`q${question.id}`} value={choice.text} checked={answers === choice.text} onChange={(e) => handleAnswerChange(question.id, e.target.value)} className="appearance-none" /> <span className={`w-6 h-6 border-2 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${answers === choice.text ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'}`}> {answers === choice.text && <FaCheck className="text-white" size={12}/>} </span> <span>{choice.text}</span> </label> ))} </div> );
        }

        if (question.type === 'multiple-response') {
            return ( <div className="flex flex-col gap-4 mt-8"> {question.choices.map(choice => ( <label key={choice.id} className={`${baseChoiceClass} ${answers?.includes(choice.text) ? selectedChoiceClass : 'border-slate-200 '+hoverChoiceClass}`}> <input type="checkbox" className="appearance-none" checked={answers?.includes(choice.text) || false} onChange={(e) => { const currentAnswers = answers || []; const newAnswers = e.target.checked ? [...currentAnswers, choice.text] : currentAnswers.filter((ans: string) => ans !== choice.text); handleAnswerChange(question.id, newAnswers); }}/> <span className={`w-6 h-6 border-2 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${answers?.includes(choice.text) ? 'border-indigo-600 bg-indigo-600' : 'border-slate-400'}`}> {answers?.includes(choice.text) && <FaCheck className="text-white" size={12}/>} </span> <span>{choice.text}</span> </label> ))} </div> );
        }

        if (question.type === 'fill-in-the-blank') {
            return ( <div className="mt-12 text-lg flex flex-wrap items-center gap-y-4 leading-relaxed"> {question.textParts.map((part, index) => ( <React.Fragment key={index}> <span className="text-slate-800">{part}</span> {index < question.textParts.length - 1 && ( <input type="text" value={answers?.[index] || ''} onChange={(e) => { const newAnswers = [...(answers || [])]; newAnswers[index] = e.target.value; handleAnswerChange(question.id, newAnswers); }} className="inline-block mx-3 p-2 border-2 border-slate-300 rounded-lg shadow-inner w-56 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-colors" /> )} </React.Fragment> ))} </div> );
        }

        if (question.type === 'sequencing') {
            const selectedSequence: string[] = answers || [];
            const availableChoices = question.choices.filter(c => !selectedSequence.includes(c.text));
            return (
                <div className="grid lg:grid-cols-2 gap-8 mt-8">
                    <div className="flex flex-col gap-3 p-4 bg-slate-100/70 rounded-xl border">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-bold text-slate-600">ลำดับคำตอบของคุณ</h3>
                           <button onClick={() => handleAnswerChange(question.id, [])} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed" disabled={selectedSequence.length === 0}> เริ่มใหม่ </button>
                        </div>
                        <div className="flex flex-col gap-3 min-h-[200px]">
                        {selectedSequence.length > 0 ? (
                            selectedSequence.map((item, index) => (
                                <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center gap-4 animate-in fade-in-50 duration-300">
                                    <span className="font-bold text-lg text-indigo-600">{index + 1}</span>
                                    <span className="flex-1 text-slate-800 font-medium">{item}</span>
                                    <button onClick={() => handleSequenceRemove(index)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"> <FaTimes /> </button>
                                </div>
                            ))
                        ) : ( <div className="h-full flex items-center justify-center text-slate-500 text-center p-4"> คลิกตัวเลือกด้านขวา<br/>เพื่อเริ่มเรียงลำดับ </div> )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        <h3 className="font-bold text-slate-600 mb-2 text-center">คลิกตัวเลือกตามลำดับที่ถูกต้อง</h3>
                        {availableChoices.map(choice => (
                             <button key={choice.id} onClick={() => handleSequenceSelect(choice.text)}
                                     className="p-4 bg-white rounded-xl shadow-md text-center transition-all duration-200 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-1 w-full border-2 border-slate-200">
                                 <span className="text-slate-800 font-semibold">{choice.text}</span>
                             </button>
                        ))}
                        {availableChoices.length === 0 && ( <div className="text-center text-slate-500 mt-4 p-4 rounded-lg bg-green-50  font-semibold"> คุณได้เรียงลำดับครบทุกขั้นตอนแล้ว </div> )}
                    </div>
                </div>
            )
        }

        if (question.type === 'matching') {
            const placedAnswers = answers || {};
            const placedValues = Object.values(placedAnswers);
            const availableOptions = (question.optionsForMatching || []).filter(opt => !placedValues.includes(opt));
            return (
                <div className="grid lg:grid-cols-2 gap-12 mt-8">
                    <div className="flex flex-col gap-4">
                        {question.choices.map((prompt) => (
                            <div key={prompt.id} className="flex items-center gap-4">
                                <span className="w-28 font-semibold text-slate-700 shrink-0 text-right">{prompt.text}</span>
                                <button type="button" onClick={() => handleMatchingClick(prompt.id)}
                                    className={`flex-1 h-16 border-2 border-dashed rounded-lg flex items-center justify-center p-2 transition-all duration-200 ${selectedMatchingOption ? 'border-indigo-500 bg-indigo-50 hover:bg-indigo-100 ring-4 ring-indigo-500/20' : 'border-slate-300 hover:bg-slate-50'}`}>
                                    {placedAnswers[prompt.id] ? (
                                        <div className="p-3 bg-teal-500 text-white font-semibold rounded-lg shadow-sm w-full text-center"> {placedAnswers[prompt.id]} </div>
                                    ) : ( <span className={`text-sm ${selectedMatchingOption ? 'text-indigo-600 font-semibold animate-pulse' : 'text-slate-400'}`}> {selectedMatchingOption ? 'คลิกเพื่อวาง' : 'ช่องว่าง'} </span> )}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3 p-4 bg-slate-100/70 rounded-xl self-start border">
                        <h3 className="font-bold text-center text-slate-600 mb-2">คลิกเพื่อเลือกตัวเลือก</h3>
                        {availableOptions.map((option) => (
                            <button key={option} type="button" onClick={() => setSelectedMatchingOption(option)}
                                className={`p-3 bg-white rounded-lg shadow-md text-center transition-all duration-200 ${selectedMatchingOption === option ? 'ring-2 ring-indigo-500 shadow-xl scale-105' : 'hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5'}`}>
                                <span className="text-slate-800 font-semibold">{option}</span>
                            </button>
                        ))}
                         {availableOptions.length === 0 && <span className="text-center text-slate-500 text-sm mt-4 p-4 rounded-lg bg-green-50  font-semibold">ใช้ตัวเลือกครบแล้ว</span>}
                    </div>
                </div>
            );
        }
        
        return <div>ไม่รู้จักประเภทคำถามนี้</div>;
    };
    
    return (
        <main className="bg-gradient-to-br mt-[-30px] from-slate-50 via-gray-100 to-indigo-100 min-h-screen p-4 sm:p-8 font-sans">
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    style: { borderRadius: '8px', fontSize: '16px', padding: '16px 24px', fontWeight: '600', },
                    success: { style: { background: '#F0FDF4', color: 'black', }, },
                    error: { style: { background: '#FFF1F2', color: 'black', }, },
                }}
            />

            {/* --- [เพิ่ม] แสดง Modal ทั้งสองแบบตามเงื่อนไข --- */}
            {showFailModal && <FailModal onClose={() => setShowFailModal(false)} />}
            {showPassModal && (
                <PassModal
                    score={finalScore}
                    totalQuestions={totalQuestions}
                    onNavigate={() => router.push('/student/course-details/quiz/certificate')}
                />
            )}
            
            <div className="w-full max-w-4xl bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg p-6 sm:p-10 mx-auto mt-10">
                {/* ... header, section, footer เหมือนเดิม ... */}
                <header className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                       <h1 className="text-base font-bold text-indigo-600 uppercase tracking-wider">
                           {getQuestionTypeDisplayName(currentQuestion.type)}
                       </h1>
                       <span className="font-semibold text-slate-600 text-sm">
                           ข้อที่ {currentPage + 1} / {totalQuestions}
                       </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                       <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </header>

                <section>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">{currentQuestion.title}</h2>
                    <hr className="mb-6 border-slate-200" />
                    {renderQuestion(currentQuestion)}
                </section>

                <footer className="flex justify-between items-center mt-12 pt-6 border-t-2 border-slate-200/80">
                    <button onClick={goToPrev} disabled={currentPage === 0} className="px-6 py-3 font-semibold text-slate-600 rounded-full hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                        <FaChevronLeft size={12} />
                        ย้อนกลับ
                    </button>
                    {currentPage < totalQuestions - 1 ? (
                        <button onClick={goToNext} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 active:bg-indigo-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200">
                            ข้อถัดไป
                        </button>
                    ) : (
                        <button onClick={handleSubmit} className="px-8 py-3 bg-teal-500 text-white font-bold rounded-full hover:bg-teal-600 active:bg-teal-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all duration-200">
                            ส่งแบบทดสอบ
                        </button>
                    )}
                </footer>
            </div>
        </main>
    );
};

export default StudentQuizPage;