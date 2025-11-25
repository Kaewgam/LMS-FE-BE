"use client";

// import { useAuth } from './context/AuthContext';

export default function Home() {
  // const { user } = useAuth();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>หน้าหลัก</h1>
      {true ? (
        <p>คุณได้เข้าสู่ระบบเรียบร้อยแล้ว</p>
      ) : (
        <p>กรุณาลงชื่อเข้าใช้ที่เมนูด้านบน</p>
      )}
    </div>
  );
}