'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineOfficeBuilding, HiOutlineMail, HiOutlineEmojiHappy, HiCheck, HiX } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';
import api from '@/lib/api';

const UNI_ID = process.env.NEXT_PUBLIC_UNIVERSITY_ID?.trim() || '';

// ===== helper: แปลง /media/... เป็น URL เต็ม =====
const toAbsolute = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    '';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

// --- ไอคอนโปรไฟล์ที่สร้างขึ้นใหม่ด้วย SVG ---
const CustomProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="black" />
    <path d="M20 18.6667C20 16.5215 16.4183 14 12 14C7.58172 14 4 16.5215 4 18.6667V20H20V18.6667Z" fill="black" />
  </svg>
);

// --- Component ย่อยสำหรับแสดงข้อมูล ---
interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  actionText?: string;
  onActionClick?: () => void;
}
const InfoField: React.FC<InfoFieldProps> = ({ icon, label, value, actionText, onActionClick }) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
    {icon}
    <div className="flex-grow flex justify-between items-end min-h-[45px]">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm mt-2">{value}</p>
      </div>
      {actionText && (
        <p onClick={onActionClick} className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
          {actionText}
        </p>
      )}
    </div>
  </div>
);

// --- Component ย่อยสำหรับส่วนรูปภาพโปรไฟล์ ---
interface ProfilePictureCardProps {
  profileImage: string | null;
  imagePreview: string | null;
  onUploadClick: () => void;
  onSave: () => void;
  onCancel: () => void;
}
const ProfilePictureCard: React.FC<ProfilePictureCardProps> = ({
  profileImage,
  imagePreview,
  onUploadClick,
  onSave,
  onCancel,
}) => {
  const displayImage = imagePreview || profileImage;
  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border-2 border-black">
      <h2 className="text-lg font-semibold text-slate-700 mb-6">รูปภาพโปรไฟล์</h2>
      <div className="flex flex-col sm:flex-row items-center justify-center sm:gap-12 md:gap-16 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-36 h-36 rounded-full bg-white border-2 border-black flex items-center justify-center p-1 overflow-hidden">
            {displayImage ? (
              <img src={displayImage} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="p-3">
                <CustomProfileIcon className="w-full h-full" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">เฉพาะไฟล์ png, jpeg</p>
        </div>

        <div className="text-center sm:text-right">
          {imagePreview ? (
            <div className="flex items-center gap-4">
              <button onClick={onSave} className="bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-green-700 transition-colors shadow-sm cursor-pointer">
                บันทึก
              </button>
              <button onClick={onCancel} className="bg-slate-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-slate-600 transition-colors shadow-sm cursor-pointer">
                ยกเลิก
              </button>
            </div>
          ) : (
            <button onClick={onUploadClick} className="bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-blue-600 transition-colors shadow-sm cursor-pointer">
              อัปโหลดโปรไฟล์
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Component หลักของหน้าตั้งค่า ---
const SettingsPage = () => {
  // --- State สำหรับรูปโปรไฟล์ ---
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State สำหรับข้อมูลผู้ใช้ (ผูก DB) ---
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState('');

  // --- State สำหรับแก้ไขชื่อองค์กร (หน้าตาเดิม; ยังไม่ผูก backend) ---
  const [organizationName, setOrganizationName] = useState('กรอกชื่อองค์กรของคุณ');
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [tempOrganizationName, setTempOrganizationName] = useState(organizationName);

  // ===== โหลดโปรไฟล์จาก backend =====
  useEffect(() => {
  (async () => {
    try {
      // โหลดโปรไฟล์ผู้ใช้
      const { data } = await api.get('/api/auth/user/');
      setEmail(data.email ?? '');
      setUsername(data.full_name ?? '');
      setTempUsername(data.full_name ?? '');
      setProfileImage(
        toAbsolute(data.profile_image) ||
        (data.profile_image_url ? data.profile_image_url : null)
      );

      // โหลดชื่อองค์กร (ถ้ามีตั้งค่า UNI_ID)
      if (!UNI_ID) {
        // ไม่ error แต่แจ้งเตือนครั้งเดียวก็ได้
        console.warn('NEXT_PUBLIC_UNIVERSITY_ID is not set');
      } else {
        const uni = await api.get(`/api/universities/${UNI_ID}/`);
        setOrganizationName(uni.data?.name ?? '');
        setTempOrganizationName(uni.data?.name ?? '');
      }
    } catch (e) {
      console.error(e);
      toast.error('โหลดโปรไฟล์/องค์กรไม่สำเร็จ');
    }
  })();
}, []);

  // --- Handlers สำหรับรูปโปรไฟล์ ---
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
  if (!fileInputRef.current?.files?.[0]) return;
  const file = fileInputRef.current.files[0];
  const previewUrl = imagePreview;

  try {
    const formData = new FormData();
    formData.append('profile_image', file);

    // ไม่ต้องใส่ header multipart เอง ให้ axios จัดการ
    await api.patch('/api/auth/user/', formData);

    // ดึงโปรไฟล์ใหม่เพื่อเอา URL จริงจากเซิร์ฟเวอร์
    const { data } = await api.get('/api/auth/user/');
    const raw =
      data?.profile_image_url || data?.profile_image || null;
    setProfileImage(toAbsolute(raw));
    toast.success('อัปเดตรูปโปรไฟล์สำเร็จ!');
  } catch (e) {
    console.error(e);
    toast.error('อัปโหลดรูปไม่สำเร็จ');
  } finally {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImagePreview(null);
  }
};

  const handleCancelImage = () => setImagePreview(null);

  // --- Handlers สำหรับแก้ไขชื่อผู้ใช้ ---
  const handleEditUsernameClick = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async () => {
  try {
    await api.patch('/api/auth/user/', { full_name: tempUsername });
    setUsername(tempUsername);
    setIsEditingUsername(false);
    toast.success('เปลี่ยนชื่อผู้ใช้สำเร็จ!');
  } catch (e) {
    console.error(e);
    toast.error('ไม่สามารถเปลี่ยนชื่อได้');
  }
};

  const handleCancelUsername = () => setIsEditingUsername(false);

  // --- Handlers สำหรับแก้ไขชื่อองค์กร (local only) ---
  const handleEditOrganizationClick = () => {
  setTempOrganizationName(organizationName);
  setIsEditingOrganization(true);
};

const handleSaveOrganization = async () => {
  if (!UNI_ID) return toast.error('ยังไม่ได้ตั้งค่า UNIVERSITY_ID');
  try {
    await api.patch(`/api/universities/${UNI_ID}/`, { name: tempOrganizationName });
    setOrganizationName(tempOrganizationName);
    setIsEditingOrganization(false);
    toast.success('เปลี่ยนชื่อองค์กรสำเร็จ!');
  } catch (e) {
    console.error(e);
    toast.error('บันทึกชื่อองค์กรไม่สำเร็จ');
  }
};

const handleCancelOrganization = () => {
  setTempOrganizationName(organizationName);
  setIsEditingOrganization(false);
};

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" style={{ display: 'none' }} />

      <div className="mb-15 bg-white min-h-screen p-4 sm:p-8 ">
        <div className="max-w-2xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-semibold text-slate-800">การตั้งค่า</h1>
          </header>

          <main className="space-y-6">
            <ProfilePictureCard
              profileImage={profileImage}
              imagePreview={imagePreview}
              onUploadClick={handleUploadClick}
              onSave={handleSaveImage}
              onCancel={handleCancelImage}
            />

            <div className="space-y-6">
              {/* ส่วนแก้ไขชื่อองค์กร (ยัง local) */}
              {isEditingOrganization ? (
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
                  <HiOutlineOfficeBuilding className="text-3xl self-start" />
                  <div className="flex-grow flex flex-col gap-2">
                    <p className="text-sm font-semibold">ชื่อองค์กร</p>
                    <input
                      type="text"
                      value={tempOrganizationName}
                      onChange={(e) => setTempOrganizationName(e.target.value)}
                      className="text-sm mt-2 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                      autoFocus
                    />
                    <div className="flex gap-3 mt-2 self-end">
                      <button onClick={handleSaveOrganization} className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700">
                        <HiCheck /> บันทึก
                      </button>
                      <button onClick={handleCancelOrganization} className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600">
                        <HiX /> ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <InfoField
                  icon={<HiOutlineOfficeBuilding className="text-3xl" />}
                  label="ชื่อองค์กร"
                  value={organizationName}
                  actionText="เปลี่ยนชื่อองค์กร"
                  onActionClick={handleEditOrganizationClick}
                />
              )}

              {/* อีเมล (ดึงจาก backend) */}
              <InfoField icon={<HiOutlineMail className="text-3xl" />} label="อีเมล" value={email} />

              {/* ชื่อผู้ใช้ */}
              {isEditingUsername ? (
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
                  <HiOutlineEmojiHappy className="text-3xl self-start" />
                  <div className="flex-grow flex flex-col gap-2">
                    <p className="text-sm font-semibold">ชื่อผู้ใช้</p>
                    <input
                      type="text"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="text-sm mt-2 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                      autoFocus
                    />
                    <div className="flex gap-3 mt-2 self-end">
                      <button onClick={handleSaveUsername} className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700">
                        <HiCheck /> บันทึก
                      </button>
                      <button onClick={handleCancelUsername} className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600">
                        <HiX /> ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <InfoField
                  icon={<HiOutlineEmojiHappy className="text-3xl" />}
                  label="ชื่อผู้ใช้"
                  value={username}
                  actionText="เปลี่ยนชื่อผู้ใช้"
                  onActionClick={handleEditUsernameClick}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
