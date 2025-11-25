'use client';

import React, { useEffect, useState } from 'react';
import { FaSearch, FaChevronRight, FaChevronLeft, FaCheckCircle, FaGraduationCap, FaFacebook, FaFacebookMessenger, FaInstagram, FaLine, FaApple, FaGooglePlay, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/auth';

// Define types for cleaner code
type Course = {
    id: number;
    name: string;
};

const Page = () => {
    const [query, setQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null); // Added type here as well
    const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
    const router = useRouter(); // Initialize router
    
    function resolveRedirectFor(me: any) {
    const groups = Array.isArray(me?.groups)
      ? me.groups.map((g: any) => String(g?.name ?? g).toUpperCase())
      : [];

    const rawRole = (
      me?.role?.name ??
      me?.role_display ??
      me?.role_name ??
      me?.role ??
      ''
    ).toString().toUpperCase();

    const isAdmin =
      !!me?.is_superuser || !!me?.is_staff || rawRole === 'ADMIN' || groups.includes('ADMIN');

    const isInstructor =
      !!me?.is_instructor ||
      !!me?.is_teacher ||
      rawRole === 'INSTRUCTOR' ||
      groups.includes('INSTRUCTOR') ||
      groups.includes('TEACHER');

    if (isAdmin) return '/admin';
    if (isInstructor) return '/my-courses';
    return '/home'; // STUDENT หรืออื่น ๆ
  }

  // 👇 guard: ถ้าเข้ามาหน้า /home ตรง ๆ และเป็นครู/แอดมิน ให้รีไดเรกต์
  useEffect(() => {
    const me = getMe<any>();
    if (me) {
      const dest = resolveRedirectFor(me);
      if (dest !== '/home') router.replace(dest);
    }
  }, [router]);

    const coursesList: Course[] = [
        { id: 1, name: 'Introduction to Programming' },
        { id: 2, name: 'Web Development Bootcamp' },
        { id: 3, name: 'Data Science with Python' },
        { id: 4, name: 'UI/UX Design Fundamentals' },
        { id: 5, name: 'Digital Marketing Strategy' },
    ];

    const handleCourseSelect = (course: Course) => {
        setSelectedCourse(course);
        setQuery(course.name);
        setIsCoursesDropdownOpen(false);
        router.push('/student/course-details'); // Navigate to course details page
    };

    const images = [
        { src: '/images/20.PNG' },
        { src: '/images/8.PNG' },
        { src: '/images/9.PNG' },
    ];
    const [currentSlide, setCurrentSlide] = useState(0);
    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const handleMoreClick = () => {
        router.push('/student/course');
    };

    const handleTestClick = () => {
        window.open('https://www.16personalities.com/th', '_blank', 'noopener,noreferrer');

    };

    const handleRegister = () => {
        alert("คุณกำลังลงทะเบียน");
    };

    const handleInquiryClick = () => {
        router.push('/in-house-training');
    };

    const reviews = [
        {
            text: "เว็บใช้งานได้ดี ยูสเซอร์เฟรนด์ลี่ และทันสมัยมากๆ ค่ะ",
            name: "ศุภริสา สุขสวัสดิ์",
            university: "มหาวิทยาลัยเกษตร",
            avatar: "/images/40.png",
        },
        {
            text: "ชอบคอร์สนี้มากค่ะ เข้าใจง่าย มีแบบฝึกหัดให้ทำด้วย ได้ความรู้เยอะเลย",
            name: "อภัสรา พิพัฒน์",
            university: "มหาวิทยาลัยเชียงใหม่",
            avatar: "/images/40.png",
        },
        {
            text: "อาจารย์สอนดีมากครับ ระบบเรียนออนไลน์ใช้งานง่ายและสะดวกมาก",
            name: "ธีรภัทร รัตนกุล",
            university: "มหาวิทยาลัยธรรมศาสตร์",
            avatar: "/images/40.png",
        },
    ];

    const statistics = [
        { label: "ผู้เรียน", value: "+200" },
        { label: "ผู้สอน", value: "+200" },
        { label: "องค์กร", value: "+200" },
        { label: "คอร์ส", value: "+200" },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const goNext = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const goPrev = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    const currentReview = reviews[currentIndex];

    return (
        <div>
            {/* Cover Image */}
            <div className="mx-[100px] mt-[30px] p-5">
                <img src="/images/5.PNG" alt="Cover Image" className="h-full w-full rounded-[15px] object-cover shadow-[0px_10px_20px_rgba(0,0,0,0.5)]" />
            </div>

            {/* Search Section */}
            <div className="mx-[100px] mt-5 p-5">
                <h1 className="self-start text-2xl font-semibold text-black mb-6">ค้นหาคอร์สที่คุณต้องการเพิ่มทักษะ</h1>
                <div className="flex w-full">
                    <div className="relative w-[600px]">
                        {/* MODIFIED PART HERE */}
                        <div className="flex items-center rounded-2xl border-2 border-black p-3 text-sm focus-within:ring-1 focus-within:ring-black">
                            <FaSearch className="mr-2.5 text-black" />
                            <input
                                type="text"
                                placeholder="ค้นหาคอร์สที่นี่"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedCourse(null);
                                    setIsCoursesDropdownOpen(true);
                                }}
                                onFocus={() => setIsCoursesDropdownOpen(true)}
                                className="flex-1 border-none text-sm outline-none bg-transparent" // Added bg-transparent
                            />
                            <button onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)} className="ml-2 cursor-pointer">
                                {isCoursesDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>
                        {isCoursesDropdownOpen && (
                            <div className="absolute z-10 mt-2 w-full rounded-md bg-white shadow-lg border border-gray-200">
                                <ul className="max-h-60 overflow-auto">
                                    {coursesList
                                        .filter((course) => course.name.toLowerCase().includes(query.toLowerCase()))
                                        .map((course) => (
                                            <li
                                                key={course.id}
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleCourseSelect(course)}
                                            >
                                                {course.name}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slideshow */}
            <div className="mx-[100px] mt-5 p-5">
                <div className="relative max-w-full overflow-hidden rounded-[15px] shadow-[0px_10px_20px_rgba(0,0,0,0.5)]">
                    {images.map((image, index) => (
                        <div key={index} className={index === currentSlide ? 'block' : 'hidden'}>
                            <img src={image.src} alt={`Slide ${index + 1}`} className="h-auto w-full" />
                        </div>
                    ))}
                </div>
                <br /><br />
                <div className="relative left-1/2 flex -translate-x-1/2 justify-center gap-2.5">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-3 w-3 cursor-pointer rounded-full bg-gray-400 transition-all duration-300 ease-in-out ${currentSlide === index ? 'scale-125 bg-[#414E51]' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {/* Recommended Courses */}
            <div className="mx-[100px] mt-6 p-5">
                <div className="flex w-full items-center justify-between">
                    <h3 className="text-2xl font-semibold text-black">คอร์สแนะนำ</h3>
                    <button onClick={handleMoreClick} className="cursor-pointer text-xl font-semibold hover:underline flex items-center">
                        เพิ่มเติม <FaChevronRight className="ml-2.5" />
                    </button>
                </div>
                <div className="mt-5 flex w-full flex-wrap justify-center gap-6">
                    <img src="/images/10.PNG" alt="Course 1" className="w-[300px] rounded-lg" />
                    <img src="/images/11.PNG" alt="Course 2" className="w-[300px] rounded-lg" />
                    <img src="/images/12.PNG" alt="Course 3" className="w-[300px] rounded-lg" />
                    <img src="/images/13.PNG" alt="Course 4" className="w-[300px] rounded-lg" />
                </div>
            </div>

            {/* Personalized Test */}
            <div className="mx-[100px] mt-6 p-5">
                <h2 className="mb-5 flex text-2xl font-semibold text-[#333]">ไม่แน่ใจใช่ไหมว่าตัวเรานั้นเป็นเรื่องอะไร ลองทำ Test personalized หาตัวตนที่แท้จริงของเราดู</h2><br />
                <div className="flex items-center justify-between">
                    <img src="/images/14.png" alt="Personalized Test" className="h-auto w-[35%] rounded-[15px] object-cover" />
                    <div className="w-[60%] flex-col">
                        <p className="mb-5 ml-4 text-base text-black">
                            ✨ เพื่อการเรียนรู้ที่ตรงกับความสนใจและสไตล์การเรียนรู้ของแต่ละบุคคล เพื่อเชิญชวนทุกคนทำ
                            <br /><br />
                            แบบทดสอบ Personalized Test ที่ออกแบบมาเพื่อวิเคราะห์หัวข้อ ความสนใจ และสไตล์การเรียนรู้
                            <br /><br />
                            🧠 แบบทดสอบนี้จะช่วยให้คุณ:
                        </p>
                        <ul className="pl-[50px]">
                            <li className="list-disc pl-1.5">รู้จักตัวเองมากขึ้น ทั้งด้านบุคลิกภาพและความสนใจ</li><br />
                            <li className="list-disc pl-1.5">รับคำแนะนำคอร์สเรียนและกิจกรรมที่เหมาะสมกับคุณ</li><br />
                            <li className="list-disc pl-1.5">เรียนรู้ในวิธีที่เป็นไปตามปากหมายและมีประสิทธิภาพมากยิ่งขึ้น</li><br />
                        </ul>
                        <div className="flex w-full items-center justify-between">
                            <p className="mb-5 ml-4 text-base text-black">⏰ ใช้เวลาเพียง 10-15 นาที</p>
                            <button onClick={handleTestClick} className="flex cursor-pointer items-center rounded-lg border-none bg-[#414E51] hover:bg-[#2b3436] px-5 py-3 text-white">
                                ทำแบบทดสอบ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* In House Training */}
            <div className="mx-[100px] mt-6 p-5">
                <h2 className="mb-5 flex text-2xl font-semibold text-[#333]">In House Training</h2><br />
                <div className="flex items-center justify-between">
                    <img src="/images/15.png" alt="In House Training" className="h-auto w-[35%] rounded-[15px] object-cover" />
                    <div className="w-[60%] flex-col">
                        <p className="mb-5 text-xl text-black">
                            เพื่อเสริมสร้างศักยภาพในการทำงาน <br />
                            <br />
                            และพัฒนาทักษะที่จำเป็นสำหรับบุคลากรภายในองค์กร
                        </p><br />
                        <div className="flex w-full items-center justify-between">
                            <button onClick={handleInquiryClick} className="flex cursor-pointer items-center rounded-lg border-none bg-[#414E51] hover:bg-[#2b3436] p-5 text-white">
                                สนใจติดต่อสอบถามเพิ่มเติม
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            <div className="mx-[100px] mt-6 p-5">
                <h2 className="text-2xl font-semibold">Review จากผู้เรียนคอร์สของเรา</h2>
                <div className="mt-10 flex items-center gap-14">
                    <div className="relative min-h-[150px] w-[1000px] rounded-2xl border border-black p-10">
                        <FaChevronLeft onClick={goPrev} className="absolute top-1/2 left-5 cursor-pointer" />
                        <p className="px-16 pt-20 text-center text-lg">“ {currentReview.text} ”</p>
                        <FaChevronRight onClick={goNext} className="absolute top-1/2 right-5 cursor-pointer" />
                        <div className="mt-[90px] flex justify-center">
                            {reviews.map((_, idx) => (
                                <div key={idx} className={`mx-1 h-2.5 w-2.5 rounded-full ${idx === currentIndex ? 'bg-black' : 'bg-gray-300'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <img src={currentReview.avatar} alt="avatar" className="h-[100px] w-[100px] rounded-full" />
                        <p className="mt-2.5 font-semibold">{currentReview.name}</p>
                        <p>{currentReview.university}</p>
                    </div>
                </div>
                <div className="mt-16 flex flex-wrap justify-center gap-16">
                    {statistics.map((stat, idx) => (
                        <div key={idx} className="min-w-[120px] rounded-2xl border border-black py-8 px-20 text-center">
                            <div className="text-2xl font-semibold">{stat.value}</div>
                            <div>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why Learn With Us */}
            <div className="mx-[100px] mb-[-24px] mt-6 p-5">
                <h2 className="flex text-2xl font-semibold"><FaGraduationCap className="mr-2.5 text-3xl" /> ทำไมต้องเรียนกับเรา ?</h2><br />
            </div>
            <div className="flex w-full flex-row items-start justify-between bg-[#414E51] py-20 px-[130px] text-white">
                <div>
                    <p className="ml-[90px] max-w-full text-left text-xl font-normal">
                        เพราะการเรียนรู้ไม่ควรเป็นแค่ “ ภาระ ” แต่ควรเป็น
                        <br /><br />“ ประสบการณ์ที่เปลี่ยนชีวิต ”
                        <br /><br />เราจึงออกแบบระบบ LMS
                        <br /><br />ที่ตอบโจทย์ผู้เรียนทุกคนอย่างแท้จริง
                    </p>
                </div>
                <ul className="flex w-1/2 flex-row flex-wrap justify-start gap-6 p-0">
                    <li className="flex max-w-full items-center text-sm"><FaCheckCircle className="mr-4 rounded-full bg-white text-base text-[#4CAF50]" /><span>เนื้อหาคุณภาพ - หลักสูตรได้รับการออกแบบโดยผู้เชี่ยวชาญในด้านต่าง ๆ พร้อมอัปเดตเนื้อหาอยู่เสมอ</span></li>
                    <li className="flex max-w-full items-center text-sm"><FaCheckCircle className="mr-4 rounded-full bg-white text-base text-[#4CAF50]" /><span>เรียนรู้ได้ทุกที่ ทุกเวลา - เข้าเรียนได้จากทุกอุปกรณ์ ทั้งคอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟน</span></li>
                    <li className="flex max-w-full items-center text-sm"><FaCheckCircle className="mr-4 rounded-full bg-white text-base text-[#4CAF50]" /><span>ติดตามการเรียนรู้แบบ Real-time - เห็นความก้าวหน้าของคุณทุกขั้นตอน พร้อมในประกาศนิบัตรเมื่อเรียนจบ</span></li>
                    <li className="flex max-w-full items-center text-sm"><FaCheckCircle className="mr-4 rounded-full bg-white text-base text-[#4CAF50]" /><span>Interactive & Engaging - มีแบบฝึกหัด เกม กิจกรรม และแบบทดสอบที่ทำให้การเรียนไม่น่าเบื่อ</span></li>
                    <li className="flex max-w-full items-center text-sm"><FaCheckCircle className="mr-4 rounded-full bg-white text-base text-[#4CAF50]" /><span>ทีมผู้สอนมืออาชีพ - มีทีมงานพร้อมให้คำแนะนำและดูแลตลอดการใช้งาน</span></li>
                </ul>
            </div>

            {/* Partner Organizations */}
            <div className="mx-[100px] mt-6 p-5">
                <h2 className="flex text-2xl font-semibold">องค์กรที่ใช้บริการของเรา</h2><br />
            </div>
            <div className="w-full flex-row items-start bg-[#414E51] py-[90px] px-[130px] text-white">
                <div className="flex justify-center gap-10">
                    <img src="/images/30.png" alt="AIS" className="h-[180px] w-[180px] rounded-full object-contain shadow-[0px_5px_15px_rgba(0,0,0,0.1)]" />
                    <img src="/images/31.png" alt="True" className="h-[180px] w-[180px] rounded-full object-contain shadow-[0px_5px_15px_rgba(0,0,0,0.1)]" />
                    <img src="/images/32.png" alt="PTT" className="h-[180px] w-[180px] rounded-full object-contain shadow-[0px_5px_15px_rgba(0,0,0,0.1)]" />
                    <img src="/images/34.png" alt="SCG" className="h-[180px] w-[180px] rounded-full object-contain shadow-[0px_5px_15px_rgba(0,0,0,0.1)]" />
                    <img src="/images/33.png" alt="Sample" className="h-[180px] w-[180px] rounded-full object-contain shadow-[0px_5px_15px_rgba(0,0,0,0.1)]" />
                </div>
            </div>

            {/* Register CTA */}
            <div className="mx-[180px] mt-6 p-5">
                <br /><br /><br />
                <div className="flex items-center justify-between">
                    <div className="w-full flex-row items-start rounded-[15px] bg-[#414E51] py-[90px] px-[95px] text-white">
                        <div className="px-[100px]">
                            <div className="flex w-full items-center justify-between">
                                <p className="text-2xl text-white">พร้อมแล้วมาอัปสกิลไปด้วยกันกับเรา</p>
                                <button onClick={handleRegister} className="flex cursor-pointer items-center rounded-[15px] border-none bg-white py-10 px-20 text-xl text-black">
                                    ลงทะเบียน
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mx-[100px] mt-[-120px]  p-45">
                <div className="flex justify-between mb-[-120px] ">
                    <div className="flex flex-col gap-2.5"><div className="mb-1.5 text-xl font-semibold text-black">คอร์สของเรา</div><div className="text-base text-black">คอร์สทั้งหมด</div><div className="text-base text-black">คอร์สแนะนำ</div><div className="text-base text-black">Bootcamp</div><div className="text-base text-black">In House Training</div></div>
                    
                    <div className="flex flex-col gap-2.5"><div className="mb-1.5 text-xl font-semibold text-black">ติดต่อเรา</div><div className="mt-1.5 flex gap-5"><FaFacebook className="text-xl text-black" /><FaFacebookMessenger className="text-xl text-black" /></div><div className="mt-1.5 flex gap-5"><FaLine className="text-xl text-black" /><FaInstagram className="text-xl text-black" /></div></div>
                    <div className="flex flex-col gap-2.5"><div className="mb-1.5 text-xl font-semibold text-black">เกี่ยวกับเรา</div><div className="text-base text-black">คำถามที่พบบ่อย</div><div className="text-base text-black">ติดต่อสอบถามเพิ่มเติม</div><div className="text-base text-black">ช่องทางการร้องเรียน</div></div>
                    <div className="flex flex-col gap-2.5"><div className="mb-1.5 text-xl font-semibold text-black">สำหรับการศึกษา</div><div className="flex items-center gap-4"><FaApple size={32} /><div className="flex flex-col"><span className="text-sm">iOS</span><span className="text-base">Download on App Store</span></div></div><div className="flex items-center gap-4"><FaGooglePlay size={32} /><div className="flex flex-col"><span className="text-sm">Android</span><span className="text-base">Download on Play Store</span></div></div></div>
                </div>
            </div>
        </div>
    );
};

export default Page;