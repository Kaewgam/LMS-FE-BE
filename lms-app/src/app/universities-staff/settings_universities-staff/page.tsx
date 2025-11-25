'use client';

// กำหนดให้คอมโพเนนต์นี้ทำงานฝั่ง Client
import api from '@/lib/api';
import React, { useState, useRef, useEffect  } from 'react';
import { HiOutlineMail, HiOutlineEmojiHappy, HiCheck, HiX } from 'react-icons/hi';
import toast, { Toaster } from 'react-hot-toast';

const toAbsoluteMedia = (u?: string | null) => {
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const origin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://127.0.0.1:8000';
  return `${origin}${u}`;
};

// --- คอมโพเนนต์สำหรับไอคอนโปรไฟล์ (SVG) ---
const CustomProfileIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
      fill="black"
    />
    <path
      d="M20 18.6667C20 16.5215 16.4183 14 12 14C7.58172 14 4 16.5215 4 18.6667V20H20V18.6667Z"
      fill="black"
    />
  </svg>
);

// --- คอมโพเนนต์ย่อยสำหรับแสดงข้อมูล 1 บรรทัด (นำไปใช้ซ้ำได้) ---
interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  actionText?: string; // ข้อความสำหรับ Action เช่น "แก้ไข" (ถ้ามี)
  onActionClick?: () => void; // ฟังก์ชันที่จะทำงานเมื่อคลิก Action
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
        <p
          onClick={onActionClick}
          className="text-sm text-slate-500 cursor-pointer hover:text-slate-700"
        >
          {actionText}
        </p>
      )}
    </div>
  </div>
);

// --- คอมโพเนนต์ย่อยสำหรับจัดการรูปภาพโปรไฟล์ ---
interface ProfilePictureCardProps {
  profileImage: string | null;      // รูปที่บันทึกไว้
  imagePreview: string | null;      // รูปตัวอย่างที่เพิ่งอัปโหลด
  onUploadClick: () => void;        // ฟังก์ชันเมื่อกดปุ่ม 'อัปโหลด'
  onSave: () => void;               // ฟังก์ชันเมื่อกดปุ่ม 'บันทึก'
  onCancel: () => void;             // ฟังก์ชันเมื่อกดปุ่ม 'ยกเลิก'
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
              <img
                src={displayImage}
                alt="Profile Preview"
                className="w-full h-full object-cover rounded-full"
              />
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
              <button
                onClick={onSave}
                className="bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                บันทึก
              </button>
              <button
                onClick={onCancel}
                className="bg-slate-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-slate-600 transition-colors shadow-sm cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={onUploadClick}
              className="bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
            >
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('Admin_1');
  const [email, setEmail] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);

  // ✅ โหลดข้อมูลจาก API
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/user/');
        setUsername(data?.full_name ?? '');
        setTempUsername(data?.full_name ?? '');
        setEmail(data?.email ?? '');

        const rawPic = data?.profile_image_url || data?.profile_image || null;
        setProfileImage(toAbsoluteMedia(rawPic));
      } catch (e) {
        toast.error('โหลดข้อมูลผู้ดูแลมหาวิทยาลัยล้มเหลว');
      }
    })();
  }, []);

  // ---- handlers รูปโปรไฟล์ ----
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSaveImage = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    const previewUrl = imagePreview;

    try {
      const form = new FormData();
      form.append('profile_image', file);

      await api.patch('/api/auth/user/', form);

      const { data } = await api.get('/api/auth/user/');
      const rawPic = data?.profile_image_url || data?.profile_image || null;
      setProfileImage(toAbsoluteMedia(rawPic));

      toast.success('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (e) {
      toast.error('อัปเดตรูปโปรไฟล์ไม่สำเร็จ');
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setImagePreview(null);
    }
  };

  const handleCancelImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  // ---- handlers ชื่อผู้ใช้ ----
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
      toast.error('บันทึกชื่อผู้ใช้ไม่สำเร็จ');
    }
  };

  const handleCancelUsername = () => {
    setTempUsername(username);
    setIsEditingUsername(false);
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: '8px',
            fontSize: '16px',
            padding: '16px 24px',
            fontWeight: '600',
          },
          success: {
            style: {
              background: '#F0FDF4',
              color: 'black',
            },
          },
          error: {
            style: {
              background: '#FFF1F2',
              color: 'black',
            },
          },
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        style={{ display: 'none' }}
      />

      <div className="mb-15 bg-white min-h-screen p-4 sm:p-8 ">
        <div className="max-w-2xl mx-auto space-y-8">
          <main className="space-y-6">
            <ProfilePictureCard
              profileImage={profileImage}
              imagePreview={imagePreview}
              onUploadClick={handleUploadClick}
              onSave={handleSaveImage}
              onCancel={handleCancelImage}
            />

            <div className="space-y-6">
              <InfoField
                icon={<HiOutlineMail className="text-3xl" />}
                label="อีเมลองค์กร"
                value={email || '-'}
              />

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
                      <button
                        onClick={handleSaveUsername}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700"
                      >
                        <HiCheck /> บันทึก
                      </button>
                      <button
                        onClick={handleCancelUsername}
                        className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600"
                      >
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
