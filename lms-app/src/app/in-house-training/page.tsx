'use client';

import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { LuUpload } from 'react-icons/lu';
import { HiOutlineBookOpen } from 'react-icons/hi';
import { MdEditNote } from 'react-icons/md';
import { BiToggleLeft } from 'react-icons/bi';
import { FaDesktop } from 'react-icons/fa';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaBook, FaCalendarAlt } from 'react-icons/fa';

const tabs = ['Data', 'Technology', 'Design', 'Product & Business Marketing'];

const coursePages = [
    [
        {
            title: 'Leading with Data',
            type: 'Bootcamps',
            duration: '7 วัน',
            description: 'ก้าวสู่การเป็นผู้นำองค์กรที่พร้อมพาทีนสู่ Data - Driven Organization',
            link: '/home',
        },
        {
            title: 'Data Visualization Master',
            type: 'Bootcamps',
            duration: '5 วัน',
            description: 'ฝึกทำ dashboard ขั้นเทพด้วย Tableau',
            link: '/home',
        },
    ],
    [
        {
            title: 'AI for Everyone',
            type: 'Workshop',
            duration: '3 วัน',
            description: 'เริ่มต้นเข้าใจ AI แบบไม่ต้องเขียนโค้ด',
            link: '/home',
        },
        {
            title: 'SQL Intensive',
            type: 'Bootcamps',
            duration: '6 วัน',
            description: 'เรียนรู้ SQL แบบลึก พร้อมโจทย์จริง',
            link: '/home',
        },
    ],
    [
        {
            title: 'Design Thinking Essentials',
            type: 'Workshop',
            duration: '2 วัน',
            description: 'เรียนรู้การคิดเชิงออกแบบแบบรวบรัด ใช้ได้ทันที',
            link: '/home',
        },
        {
            title: 'Agile for Teams',
            type: 'Bootcamps',
            duration: '4 วัน',
            description: 'ทำงานแบบ Agile อย่างมีประสิทธิภาพ',
            link: '/home',
        },
    ],
];

const Page = () => {
    const [activeTab, setActiveTab] = useState('Data');
    const [pageIndex, setPageIndex] = useState(0);

    return (
        <div>
            <div className="bg-[#414E51] px-5 py-[100px] text-center text-white">
                <h1 className="mb-5 text-6xl font-semibold">In House Training</h1>
                <h2 className="mb-6 text-4xl font-normal">พลิกโฉมองค์กรคุณ ด้วยทักษะแห่งอนาคต</h2>
                <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed">
                    อัปสกิลให้บุคลากรขององค์กรพร้อมแข่งขันในยุคดิจิทัล ผ่านคอร์สเรียนออนไลน์ เวิร์กชอป หรือ bootcamp
                    <br />ที่ผสมผสานการเรียนรู้ด้วยเนื้อหาอัดแน่นและเน้นทำโปรเจกต์จริง
                </p>
                <Link href="/in-house-training/form-in-house-training" className="inline-block mt-5 cursor-pointer rounded-full border-none bg-white hover:bg-gray-300 px-16 py-3 font-semibold text-gray-800 shadow-lg">ติดต่อเรา</Link>
            </div>

            <div className="mx-[100px] mt-10 p-5">
                <div className="text-center text-black">
                    <h1 className="mb-2.5 text-4xl font-semibold">
                        พัฒนาระบบ e-Learning (LMS)
                    </h1>
                    <p className="mb-2.5 text-xl font-semibold">สำหรับองค์กรของคุณ โดยทีม LMS</p>
                    <p className="mb-16 text-xl font-semibold">
                        เพราะเราคือผู้ที่เข้าใจการพัฒนาแพลตฟอร์ม e-Learning ให้ตอบโจทย์การเรียนรู้อย่างแท้จริง
                    </p>

                    <div className="grid grid-cols-2 gap-x-16 gap-y-10 text-left">
                        <div>
                            <div className="mb-2.5 flex items-center gap-5">
                                <HiOutlineArrowDownTray size={24} />
                                <h3 className="text-xl font-semibold">Embed content from YouTube</h3>
                            </div>
                            <p className="text-base">สามารถ Embed คลิปจาก YouTube ได้ผ่านตาราง สังกัดคอร์สที่ต้องการสร้าง</p>
                        </div>
                        <div>
                            <div className="mb-2.5 flex items-center gap-5">
                                <LuUpload size={24} />
                                <h3 className="text-xl font-semibold">Upload & Design your course</h3>
                            </div>
                            <p className="text-base">สร้างหลักสูตรการเรียนได้ครบครัน ทั้งแบบทดสอบ Pre/Post-Test, Quiz พร้อมการอัปโหลดเอกสารประกอบการเรียนได้อย่างอิสระ</p>
                        </div>
                        <div>
                            <div className="mb-2.5 flex items-center gap-5">
                                <HiOutlineBookOpen size={24} />
                                <h3 className="text-xl font-semibold">Course Assignment & Expiration Date</h3>
                            </div>
                            <p className="text-base">มอบหมายหลักสูตรที่ต้องการให้กับพนักงานเรียนได้แบบไม่จำกัด เพื่อให้เหมาะกับพนักงานแต่ละกลุ่มและสามารถกำหนดวันที่ควรเรียนจบได้อีกด้วย</p>
                        </div>
                        <div>
                            <div className="mb-2.5 flex items-center gap-4">
                                <MdEditNote size={28} />
                                <h3 className="text-xl font-semibold">Personalized Learning Path</h3>
                            </div>
                            <p className="text-base">สร้างสรรค์เส้นทางการเรียนรู้ที่เหมาะกับบุคลากรของคุณได้แบบ Personalize เพราะแต่ละคนไม่จำเป็นต้องเรียนเหมือนกัน</p>
                        </div>
                        <div>
                            <div className="mb-2.5 flex items-center gap-4">
                                <BiToggleLeft size={28} />
                                <h3 className="text-xl font-semibold">CI Customization</h3>
                            </div>
                            <p className="text-base">ปรับแต่งหน้าระบบให้เป็นสีตาม CI ขององค์กรของคุณได้ง่ายด้วยตนเอง และแสดงผลแบบ <br />Real-time ไม่ว่าจะเป็นการปรับรูปพื้นหลัง ปรับสี และ Logo</p>
                        </div>
                        <div>
                            <div className="mb-2.5 flex items-center gap-5">
                                <FaDesktop size={24} />
                                <h3 className="text-xl font-semibold">Real-time Tracking Dashboard & Ranking</h3>
                            </div>
                            <p className="text-base">ระบบสำหรับติดตามผลการเรียนรู้ที่ดูผลลัพธ์ได้ง่ายผ่าน Real-time Tracking Dashboard และมี Ranking ภาพรวมขององค์กร</p>
                        </div>
                    </div>

                    <div className="mt-16 text-base">
                        <p className="mb-4 font-semibold text-[#414E51]">
                            ครบ จบ ทุกความต้องการของคุณ ด้วยฟีเจอร์ที่เน้นเพื่อการสร้างประสบการณ์การเรียนที่ดีที่สุด
                        </p>
                        <p className="font-semibold text-[#414E51]">ระบบที่ออกแบบมาให้ใช้งานได้ทั้งผู้เรียนและผู้ดูแลในองค์กร</p>
                    </div>
                </div>
            </div>

            <div className="mt-10 bg-[#414E51] px-[100px] py-16 text-white">
                <div className="mb-8 text-2xl">Bootcamps ยอดนิยม</div>

                <div className="mb-10 flex cursor-pointer justify-end gap-24 text-base">
                    {tabs.map((tab) => (
                        <div
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                setPageIndex(0);
                            }}
                            className={tab === activeTab ? 'font-semibold' : ''}
                        >
                            {tab}
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap justify-center gap-16">
                    {coursePages[pageIndex].map((course, idx) => (
                        <Link key={idx} href="/bootcamp/0" className="no-underline">
                            <div className="w-72 rounded-xl bg-white p-8 text-black shadow-lg transition-transform duration-200 ease-in-out hover:scale-105">
                                <div className="mb-4 text-xl font-semibold">{course.title}</div>
                                <div className="mb-2.5 flex items-center gap-2.5 text-sm">
                                    <FaBook />
                                    <span>{course.type}</span>
                                </div>
                                <div className="mb-2.5 flex items-center gap-2.5 text-sm">
                                    <FaCalendarAlt />
                                    <span>{course.duration}</span>
                                </div>
                                <div className="mt-2.5 text-sm text-gray-800">{course.description}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-10 flex justify-center gap-2.5">
                    {coursePages.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => setPageIndex(index)}
                            className={`h-2.5 w-2.5 cursor-pointer rounded-full bg-white ${pageIndex === index ? 'opacity-100' : 'opacity-40'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="mx-[100px] -mb-6 mt-6 p-5">
                <h2 className="mb-5 flex text-2xl font-semibold text-gray-800">บริษัทที่ไว้วางใจเรา</h2><br />
            </div>
            <div className="bg-[#414E51] p-24 text-center text-white">
                <div className="flex justify-center gap-10">
                    <img src="/images/30.png" alt="AIS" className="h-44 w-44 rounded-full object-contain shadow-lg" />
                    <img src="/images/31.png" alt="True" className="h-44 w-44 rounded-full object-contain shadow-lg" />
                    <img src="/images/32.png" alt="PTT" className="h-44 w-44 rounded-full object-contain shadow-lg" />
                    <img src="/images/34.png" alt="SCG" className="h-44 w-44 rounded-full object-contain shadow-lg" />
                    <img src="/images/33.png" alt="Sample" className="h-44 w-44 rounded-full object-contain shadow-lg" />
                </div>
            </div>

            <div className="mx-[100px] -mb-6 mt-6 p-5">
                <h2 className="mb-5 flex text-2xl font-semibold text-gray-800">ทักษะที่เป็นที่ต้องการสูง</h2><br />

                <div className="mb-12 grid grid-cols-3 gap-10">
                    <div className="text-base">
                        <div className="mb-4 text-base font-semibold">Data</div>
                        <ul className="list-disc pl-5 text-base leading-relaxed">
                            <li>Data Analysis</li>
                            <li>Data Visualization</li>
                            <li>Dashboard Design</li>
                            <li>Machine Learning and AI</li>
                            <li>SQL and Python Programming</li>
                            <li>Power BI, Tableau, and Data Studio</li>
                        </ul>
                    </div>
                    <div className="text-base">
                        <div className="mb-4 text-base font-semibold">Software Development</div>
                        <ul className="list-disc pl-5 text-base leading-relaxed">
                            <li>Full-stack Web Development</li>
                            <li>Mobile App Development (iOS & Android)</li>
                            <li>DevOps & Microservices</li>
                            <li>Golang</li>
                            <li>Cloud: AWS, GCP, Azure</li>
                            <li>Software Engineering Best Practices</li>
                        </ul>
                    </div>
                    <div className="text-base">
                        <div className="mb-4 text-base font-semibold">Product Management</div>
                        <ul className="list-disc pl-5 text-base leading-relaxed">
                            <li>Design Sprint</li>
                            <li>Product Strategy</li>
                        </ul>
                    </div>
                    <div className="text-base">
                        <div className="mb-4 text-base font-semibold">Business</div>
                        <ul className="list-disc pl-5 text-base leading-relaxed">
                            <li>Digital Business Strategy</li>
                            <li>Communicating with Infographics</li>
                            <li>Storytelling</li>
                            <li>Design Thinking</li>
                            <li>Agile, Scrum, and OKRs</li>
                            <li>Go-to-Market Strategies</li>
                        </ul>
                    </div>
                    <div className="text-base">
                        <div className="mb-4 text-base font-semibold">Design</div>
                        <ul className="list-disc pl-5 text-base leading-relaxed">
                            <li>User Experience (UX) Design</li>
                            <li>User Interface (UI) Design</li>
                            <li>Service Design</li>
                            <li>Design for Non-Designers</li>
                            <li>Prototyping and Usability Testing</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;