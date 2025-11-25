'use client';

import { useParams } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import Footer from '@/app/components/Footer';
import NavbarStd from '@/app/components/NavbarStd';


type Instructor = {
  name: string;
  image: string;
};

type Testimonial = {
  name: string;
  text: string;
  avatar: string;
};

type Bootcamp = {
  id: number;
  title: string;
  desc: string;
  duration: string;
  image: string;
  logo: string;
  backgroundImage: string;
  targetAudience: string[];
  instructors: Instructor[];
  testimonials: Testimonial[];
};

const bootcamps: Bootcamp[] = [
  {
    id: 0,
    title: 'AI & Machine Learning Bootcamp',
    desc: 'หลักสูตรที่เปลี่ยนจาก PM ที่ลองผิดลองถูกเอง มาเรียนรู้ Shortcut จากตัวจริงระดับโลก',
    duration: '15 กรกฎาคม - 30 ธันวาคม พ.ศ. 2565',
    image: '/images/bc1.jpg',
    logo: '/images/bc1.jpg',
    backgroundImage: '/images/bc1.jpg',
    targetAudience: [
      'Manager / Business Owner ที่ต้องการใช้ข้อมูลตัดสินใจ',
      'Marketer ที่ต้องการวิเคราะห์แคมเปญ',
      'Product Owner ที่อยากเพิ่ม Impact ด้วย AI',
    ],
    instructors: [
      { name: 'ดร. สมชาย จิตรดี', image: '/images/aj4.jpg' },
      { name: 'อาจารย์ วิไลวรรณ ศรีนวล', image: '/images/aj1.jpg' },
      { name: 'ดร. พงศ์เทพ พิทักษ์', image: '/images/aj6.jpg' },
    ],
    testimonials: [
      {
        name: 'ศุภริสา สุขสวัสดิ์',
        text: 'อาจารย์สอนดี นำไปปรับใช้กับงานได้จริง',
        avatar: '/images/40.png',
      },
      {
        name: 'วิชญา กุลประเสริฐ',
        text: 'บรรยากาศการเรียนสนุกและมีประโยชน์',
        avatar: '/images/40.png',
      },
      {
        name: 'เจนจิรา รัตนโชติ',
        text: 'ได้แนวคิดใหม่ ๆ จากการเรียนคอร์สนี้',
        avatar: '/images/40.png',
      },
      {
        name: 'ภานุวัฒน์ ใจดี',
        text: 'เหมาะกับคนเริ่มต้น เข้าใจง่าย',
        avatar: '/images/40.png',
      },
    ],
  },
  {
    id: 1,
    title: 'Data Analytics Bootcamp',
    desc: 'เรียนรู้การวิเคราะห์ข้อมูลจาก SQL, Excel และ Power BI เพื่อสร้าง Dashboard และ Insight',
    duration: '20 สิงหาคม - 20 ตุลาคม พ.ศ. 2568',
    image: '/images/dataanaly.png',
    logo: '/images/dataanaly.png',
    backgroundImage: '/dataanaly.png',
    targetAudience: [
      'Data Analyst / Business Analyst ที่อยากใช้ Excel, SQL, Power BI',
      'Marketing ที่อยากเห็นข้อมูลแบบ Dashboard',
      'คนทำงานที่ต้องการ Upskill การใช้ Data วิเคราะห์ธุรกิจ',
    ],
    instructors: [
      { name: 'ไอโซเรส อินบอร์ด', image: '/images/aj6.jpg' },
    ],
    testimonials: [
      {
        name: 'ธนพล เกียรติศรี',
        text: 'เนื้อหาครอบคลุมและเข้าใจง่ายมาก',
        avatar: '/images/40.png',
      },
    ],
  },
  {
    id: 2,
    title: 'UX/UI Design Bootcamp',
    desc: 'เรียนรู้การออกแบบ UX/UI ด้วย Design Thinking และ Figma จากมืออาชีพ',
    duration: '10 กันยายน - 30 พฤศจิกายน พ.ศ. 2568',
    image: '/images/uxui.png',
    logo: '/images/uxui.png',
    backgroundImage: '/uxui.png',
    targetAudience: [
      'Graphic Designer ที่ต้องการเปลี่ยนสายมาสาย UX/UI',
      'Frontend Developer ที่ต้องการเข้าใจ UX มากขึ้น',
      'Product Owner ที่ต้องการออกแบบประสบการณ์ที่ดี',
    ],
    instructors: [
      { name: 'ผศ. ดร. สุพจน์ พลอยงาม', 
        image: '/images/aj6.jpg' },
    ],
    testimonials: [
      {
        name: 'ปวีณา ลาภวิจิตร',
        text: 'มีการสอนที่เป็นระบบและมืออาชีพ',
        avatar: '/images/40.png',
      },
    ],
  },
  {
    id: 3,
    title: 'Full Stack Web Development Bootcamp',
    desc: 'เรียนรู้การพัฒนาเว็บไซต์ครบวงจรทั้ง Frontend และ Backend ด้วย React และ Node.js',
    duration: '1 ตุลาคม - 31 ธันวาคม พ.ศ. 2568',
    image: '/images/fullstack.jpg',
    logo: '/images/fullstack.jpg',
    backgroundImage: '/fullstack.jpg',
    targetAudience: [
      'ผู้เริ่มต้นที่อยากเป็นนักพัฒนาเว็บ',
      'นักพัฒนาที่ต้องการเพิ่มทักษะ Full Stack',
      'ผู้ที่สนใจสร้างเว็บไซต์ด้วยเทคโนโลยีล่าสุด',
    ],
    instructors: [
      { name: 'นายสมชาย พัฒนวงศ์', 
        image: '/images/aj6.jpg' 
      },
      { name: 'นางสาวศิริพร อมรเทพ', 
        image: '/images/aj4.jpg' 
      },
    ],
    testimonials: [
      {
        name: 'จารุวรรณ ชัยยะ',
        text: 'สอนเข้าใจง่ายและมีโปรเจกต์ให้ทำจริง',
        avatar: '/images/40.png',
      },
      {
        name: 'ณัฐพล กิตติชัย',
        text: 'ได้รับความรู้ครบถ้วนและอัปเดตเทคโนโลยีใหม่ๆ',
        avatar: '/images/40.png',
      },
    ],
  },
  {
    id: 4,
    title: 'Digital Marketing Bootcamp',
    desc: 'เรียนรู้กลยุทธ์การตลาดดิจิทัล การใช้โซเชียลมีเดีย และการวิเคราะห์ข้อมูลการตลาด',
    duration: '15 พฤศจิกายน พ.ศ. 2568 - 15 กุมภาพันธ์ พ.ศ. 2569',
    image: '/images/dgtmkt.jpg',
    logo: '/images/dgtmkt.png',
    backgroundImage: '/images/dgtmkt.jpg',
    targetAudience: [
      'เจ้าของธุรกิจขนาดเล็กที่ต้องการทำการตลาดออนไลน์',
      'นักการตลาดที่ต้องการเพิ่มทักษะดิจิทัล',
      'ผู้ที่สนใจเข้าใจเครื่องมือโซเชียลมีเดียและการวิเคราะห์',
    ],
    instructors: [
      { name: 'อาจารย์พิเชษฐ์ สุขสำราญ', 
        image: '/images/aj6.jpg' 
      },
    ],
    testimonials: [
      {
        name: 'ศิริลักษณ์ ศรีสุข',
        text: 'คอร์สนี้ทำให้เข้าใจการตลาดออนไลน์อย่างลึกซึ้ง',
        avatar: '/images/40.png',
      },
    ],
  },
];

export default function BootcampDetailPage() {
  const { id } = useParams();
  const bootcamp = bootcamps.find((b) => b.id === Number(id));

  if (!bootcamp) {
    return <div className="p-10 text-red-600">ไม่พบคอร์สนี้</div>;
  }

  return (
    <>
    <NavbarStd />
      <main className="mt-10">
        <section className="relative bg-white text-black mb-20">
          <div className="relative z-10 mx-auto px-6 text-center mb-20">
            <div className="mb-10 flex justify-center ">
              <Image
                src={bootcamp.logo}
                alt={`${bootcamp.title} logo`}
                layout="intrinsic"
                width={1300}
                height={400}
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{bootcamp.title}</h1>
            <p className="text-yellow-600 font-semibold mb-2">{bootcamp.desc}</p>
            <p className="text-gray-700 text-sm">{bootcamp.duration}</p>

            <div className="mt-6 flex justify-center gap-4">
              <button className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-800">
                ดาวน์โหลด syllabus
              </button>
              <button className="bg-[#339DFF] text-white px-6 py-2 rounded-md hover:bg-blue-600">
                สมัครเรียน
              </button>
            </div>
          </div>
        </section>

        {/* Target Audience */}
        {bootcamp.targetAudience && (
          <section className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-6">หลักสูตรนี้เหมาะกับใคร</h2>
            <div className="space-y-5 text-sm md:text-base text-left md:text-center">
              {bootcamp.targetAudience.map((item, idx) => (
                <p key={idx}>• {item}</p>
              ))}
            </div>
          </section>
        )}

        {/* Instructors */}
        {bootcamp.instructors?.length > 0 && (
          <section className="py-12 px-6">
            <h2 className="text-left text-xl font-bold mb-10 ml-20">อาจารย์</h2>

            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
              {bootcamp.instructors.map((inst, index) => (
                <div
                  key={index}
                  className="w-[300px] h-[400px] bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center"
                >
                  <div className="w-[200px] h-[350px] overflow-hidden rounded-md mb-4">
                    <Image
                      src={inst.image}
                      alt={inst.name}
                      width={160}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  </div>

                  <p className="text-sm font-medium text-gray-800 text-center mt-5">{inst.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        {bootcamp.testimonials?.length > 0 && (
          <section className="py-12 px-6">
            <h2 className="text-left text-lg font-bold mb-30 ml-20">
              เสียงตอบรับจากผู้เรียน Bootcamps
            </h2>

            <div className="flex flex-wrap justify-center gap-10 mb-10">
              {bootcamp.testimonials.slice(0, 2).map((t, index) => (
                <div
                  key={index}
                  className="w-[400px] h-[200px] bg-white border border-gray-200 rounded-xl p-5 shadow-md text-center"
                >
                  <div className="w-[100px] h-[100px] mx-auto -mt-14 mb-3 rounded-full border border-gray-300 bg-white overflow-hidden">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={120}
                      height={120}
                      className="rounded-full object-cover mx-auto w-full h-full"
                    />
                  </div>
                  <p className="mb-4 text-sm text-gray-700 leading-relaxed mt-8">“{t.text}”</p>
                  <p className="text-xs text-gray-500 mt-10">{t.name}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-10 mt-20">
              {bootcamp.testimonials.slice(2).map((t, index) => (
                <div
                  key={index + 2}
                  className="w-[400px] h-[200px] bg-white border border-gray-200 rounded-xl p-5 shadow-md text-center"
                >
                  <div className="w-[100px] h-[100px] mx-auto -mt-14 mb-3 rounded-full border border-gray-300 bg-white overflow-hidden">
                    <Image
                      src={t.avatar}
                      alt={t.name}
                      width={120}
                      height={120}
                      className="rounded-full object-cover mx-auto w-full h-full"
                    />
                  </div>
                  <p className="mb-4 text-sm text-gray-700 leading-relaxed mt-8">“{t.text}”</p>
                  <p className="text-xs text-gray-500 mt-10">{t.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}