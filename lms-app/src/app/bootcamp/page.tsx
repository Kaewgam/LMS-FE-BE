"use client";

import React, { useState } from "react"; 
import Link from "next/link";
import Footer from "../components/Footer";

const bootcamps = [
  {
    id: 0,
    title: "🧑‍💻 AI & Machine Learning Bootcamp",
    desc: [
      "คอร์สปูพื้นฐาน AI ด้วยการลงมือทำจริงตั้งแต่ 0 ในระยะเวลาอัดแน่น",
      "Python for Data Science",
      "Machine Learning Algorithms",
      "Deep Learning, NLP, และการประยุกต์ใช้งานในโลก AI",
    ],
    duration: "ระยะเวลา: 10 สัปดาห์",
    image: "/images/bc1.jpg",
  },
  {
    id: 1,
    title: "📊 Data Analytics Bootcamp",
    desc: [
      "เรียนรู้การวิเคราะห์ข้อมูลเชิงลึกด้วยเครื่องมือยอดนิยม",
      "Excel, SQL, Power BI, Tableau",
      "Data Cleaning & Visualization",
      "Data-driven Decision Making",
    ],
    duration: "ระยะเวลา: 8 สัปดาห์",
    image: "/images/dataanaly.png",
  },
  {
    id: 2,
    title: "🎨 UX/UI Design Bootcamp",
    desc: [
      "ออกแบบประสบการณ์ผู้ใช้ด้วย Figma",
      "UX Research & Prototyping",
      "Design System & Components",
      "ฝึกทำ Portfolio จริง",
    ],
    duration: "ระยะเวลา: 6 สัปดาห์",
    image: "/images/uxui.png",
  },
  {
    id: 3,
    title: "📱 Full Stack Web Dev Bootcamp",
    desc: [
      "HTML, CSS, JavaScript, React, Node.js",
      "API Integration & MongoDB",
      "Deployment และ DevOps เบื้องต้น",
      "ฝึกสร้างเว็บจริงและโค้ดร่วมกัน",
    ],
    duration: "ระยะเวลา: 12 สัปดาห์",
    image: "/images/fullstack.jpg",
  },
  {
    id: 4,
    title: "📈 Digital Marketing Bootcamp",
    desc: [
      "เรียนรู้กลยุทธ์การตลาดดิจิทัล",
      "SEO, Google Ads, Meta Ads",
      "Content Strategy & Social Media",
      "วัดผลและปรับแผนจากข้อมูลจริง",
    ],
    duration: "ระยะเวลา: 5 สัปดาห์",
    image: "/images/dgtmkt.png",
  },
];

const ITEMS_PER_PAGE = 5;

const BootcampsContent: React.FC = () => {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(bootcamps.length / ITEMS_PER_PAGE);

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentBootcamps = bootcamps.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      <main className="max-w-6xl mt-10 mx-auto px-4">
        {/* Section: Banner */}
        <div className="text-2xl font-semibold mb-10">Bootcamps</div>

        <section className="flex flex-col md:flex-row items-start gap-6 mb-10">
          {/* Image */}
          <div className="w-full md:w-[400px] h-[270px] flex-shrink-0">
            <img
              src="/images/bootcamps.jpg"
              alt="Bootcamp Banner"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="text-sm text-gray-600 leading-relaxed space-y-5">
              <p className="text-[16px] font-semibold px-5 pt-10 pb-4">
                อัปเกรดทักษะอย่างก้าวกระโดด กับ Bootcamp ระยะยาวที่ออกแบบมาเพื่ออนาคตของคุณ
              </p>
              <p className="text-[16px] font-medium px-10">
                Data Analytics, UX/UI Design, Product Management และ Digital Leadership
              </p>
              <p className="text-[16px] font-medium px-5">สอนสดทุกคลาสโดยโค้ชตัวจริงในวงการ</p>
              <p className="text-[16px] font-medium px-5">
                เหมาะสำหรับคนทำงานที่ต้องการอัปสกิลและเปลี่ยนสายงาน หรือแม้แต่คนที่ไม่มีพื้นฐานมาก่อน
              </p>
            </div>
          </div>
        </section>

        {/* Section: Bootcamp List */}
        <section>
          <h2 className="text-2xl font-semibold mt-15 mb-10">คอร์ส Bootcamps ทั้งหมด</h2>

          {currentBootcamps.map((b) => (
            <div
              key={b.id}
              className="flex flex-col md:flex-row border border-gray-300 rounded-2xl overflow-hidden mb-10 shadow-md p-6 md:p-10 gap-6"
            >
              {/* Left: Image */}
              <div className="w-full md:w-[600px] h-[400px] md:h-auto">
                <img
                  src={b.image}
                  alt={b.title}
                  className="object-cover w-full h-full rounded-lg"
                />
              </div>

              {/* Right: Content */}
              <div className="flex-1 p-6">
                <h3 className="text-[20px] font-medium mb-2">{b.title}</h3>
                <ul className="text-[16px] list-disc list-inside text-gray-700 mb-2">
                  {b.desc.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
                <div className="text-[16px] text-gray-400 mb-4">{b.duration}</div>
                <Link href={`/bootcamp/${b.id}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-[14px] py-2 px-10 rounded-full">
                    รายละเอียดการสมัคร
                  </button>
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex justify-center items-center mt-10 gap-4 text-gray-700 text-sm select-none">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`text-lg ${
                page === 1 ? "text-gray-400 cursor-not-allowed" : "cursor-pointer hover:text-blue-600"
              }`}
            >
              ‹
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    pageNum === page
                      ? "font-semibold border border-gray-300 bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100 cursor-pointer"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`text-lg ${
                page === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "cursor-pointer hover:text-blue-600"
              }`}
            >
              ›
            </button>
          </div>
        </section>
      </main>

     <Footer />
    </>
  );
};

export default BootcampsContent;
