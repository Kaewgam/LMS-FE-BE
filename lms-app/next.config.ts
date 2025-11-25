// next.config.ts (อยู่รากโปรเจกต์)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // พอใช้ domains ได้เลย (ง่ายสุด)
    domains: [
      "lh3.googleusercontent.com",
      "localhost",        // รูปจาก BE ที่รันโลคอล
      "127.0.0.1",        // เผื่อเรียกด้วย IP
      "picsum.photos",    // รูป default ของคอร์ส
    ],
    // หรือถ้าชอบแบบกำหนด protocol ชัด ๆ ใช้ remotePatterns แทน
    // remotePatterns: [
    //   { protocol: "https", hostname: "lh3.googleusercontent.com" },
    //   { protocol: "https", hostname: "picsum.photos" },
    //   { protocol: "http",  hostname: "localhost" },
    //   { protocol: "http",  hostname: "127.0.0.1" },
    // ],
  },
};

export default nextConfig;
