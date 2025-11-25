// src/components/Footer.tsx
"use client";

import React from "react";
import { FaFacebook, FaFacebookMessenger, FaLine, FaInstagram, FaApple, FaGooglePlay } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <div className="mx-[100px] mt-6 p-5">
      <div className="flex justify-between flex-wrap gap-8 p-10 border-t border-gray-200">
        {/* คอร์สของเรา */}
        <div className="flex flex-col gap-2.5 min-w-[150px]">
          <div className="mb-1.5 text-xl font-semibold text-black">คอร์สของเรา</div>
          <div className="text-base text-black">คอร์สทั้งหมด</div>
          <div className="text-base text-black">คอร์สแนะนำ</div>
          <div className="text-base text-black">Bootcamp</div>
          <div className="text-base text-black">In House Training</div>
        </div>

        {/* ร่วมงานกับเรา */}
        <div className="flex flex-col gap-2.5 min-w-[150px]">
          <div className="mb-1.5 text-xl font-semibold text-black">ร่วมงานกับเรา</div>
          <div className="text-base text-black">ร่วมงานกับเรา</div>
          <div className="text-base text-black">สอบถามเรา</div>
        </div>

        {/* ติดต่อเรา */}
        <div className="flex flex-col gap-2.5 min-w-[150px]">
          <div className="mb-1.5 text-xl font-semibold text-black">ติดต่อเรา</div>
          <div className="mt-1.5 flex gap-5">
            <FaFacebook className="text-xl text-black" />
            <FaFacebookMessenger className="text-xl text-black" />
          </div>
          <div className="mt-1.5 flex gap-5">
            <FaLine className="text-xl text-black" />
            <FaInstagram className="text-xl text-black" />
          </div>
        </div>

        {/* เกี่ยวกับเรา */}
        <div className="flex flex-col gap-2.5 min-w-[150px]">
          <div className="mb-1.5 text-xl font-semibold text-black">เกี่ยวกับเรา</div>
          <div className="text-base text-black">คำถามที่พบบ่อย</div>
          <div className="text-base text-black">ติดต่อสอบถามเพิ่มเติม</div>
          <div className="text-base text-black">ช่องทางการร้องเรียน</div>
        </div>

        {/* สำหรับการศึกษา */}
        <div className="flex flex-col gap-2.5 min-w-[180px]">
          <div className="mb-1.5 text-xl font-semibold text-black">สำหรับการศึกษา</div>
          <div className="flex items-center gap-4">
            <FaApple size={32} />
            <div className="flex flex-col">
              <span className="text-sm">iOS</span>
              <span className="text-base">Download on App Store</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FaGooglePlay size={32} />
            <div className="flex flex-col">
              <span className="text-sm">Android</span>
              <span className="text-base">Download on Play Store</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
