"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlineMail,
  HiOutlineEmojiHappy,
  HiOutlineLockClosed,
  HiCheck,
  HiX,
} from "react-icons/hi";
import toast, { Toaster } from "react-hot-toast";

// === API ===
import { getMe, updateMe, updateProfileImage, changePassword } from "@/lib/api";
import { API_BASE } from "@/lib/api";

// --- Avatar SVG ---
const CustomProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 12c2.209 0 4-1.791 4-4s-1.791-4-4-4S8 5.791 8 8s1.791 4 4 4Z"
      fill="black"
    />
    <path
      d="M20 18.667C20 16.522 16.418 14 12 14s-8 2.522-8 4.667V20h16v-1.333Z"
      fill="black"
    />
  </svg>
);

// --- Reusable field ---
interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  actionText?: string;
  onActionClick?: () => void;
}
const InfoField: React.FC<InfoFieldProps> = ({
  icon,
  label,
  value,
  actionText,
  onActionClick,
}) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
    {icon}
    <div className="flex-grow flex justify-between items-end min-h-[45px]">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {typeof value === "string" ? (
          <p className="text-sm mt-2">{value}</p>
        ) : (
          <div className="text-sm mt-2">{value}</div>
        )}
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

// --- Profile card ---
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
      <h2 className="text-lg font-semibold text-slate-700 mb-6">
        รูปภาพโปรไฟล์
      </h2>
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
                className="bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-green-700"
              >
                บันทึก
              </button>
              <button
                onClick={onCancel}
                className="bg-slate-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-slate-600"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              onClick={onUploadClick}
              className="bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-blue-600"
            >
              อัปโหลดโปรไฟล์
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  // me
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // avatar
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // password
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ---- initial load ----
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setEmail(me.email || "");
        const name = me.full_name || me.email?.split("@")[0] || "";
        setUsername(name);
        setTempUsername(name);

        let url = me.profile_image_url || null;
        if (url && !/^https?:\/\//i.test(url)) url = `${API_BASE}${url}`;
        setProfileImage(url);
      } catch {
        toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      }
    })();
  }, []);

  useEffect(() => {
  return () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  };
}, [imagePreview]);

  // ---- avatar handlers ----
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview); // เคลียร์ของเดิม
    setUploadFile(f);
    setImagePreview(URL.createObjectURL(f));
  };
  const handleSaveImage = async () => {
    if (!uploadFile) return;
    try {
      const res = await updateProfileImage(uploadFile); // ถ้า api คืน url มาใช้เลย
      // refresh me อีกครั้งเผื่อ serializer คำนวณ url ใหม่
      const me = await getMe();
      let url = me.profile_image_url || null;
      if (url && !/^https?:\/\//i.test(url)) url = `${API_BASE}${url}`;
      setProfileImage(url);

      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setUploadFile(null);
      toast.success("อัปเดตรูปโปรไฟล์สำเร็จ!");
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ");
    }
  };
  const handleCancelImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setUploadFile(null);
  };

  // ---- username handlers ----
  const handleEditUsernameClick = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };
  const handleSaveUsername = async () => {
    try {
      await updateMe({ full_name: tempUsername });
      setUsername(tempUsername);
      setIsEditingUsername(false);
      toast.success("เปลี่ยนชื่อผู้ใช้สำเร็จ!");
    } catch {
      toast.error("บันทึกชื่อผู้ใช้ไม่สำเร็จ");
    }
  };
  const handleCancelUsername = () => setIsEditingUsername(false);

  // ---- password handlers ----
  const handleEditPasswordClick = () => setIsEditingPassword(true);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFields((p) => ({ ...p, [name]: value }));
  };
  const handleSavePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordFields;
    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("กรอกข้อมูลให้ครบ");
    if (newPassword !== confirmPassword)
      return toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
      setIsEditingPassword(false);
      setPasswordFields({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ");
    }
  };
  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    setPasswordFields({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <>
      <Toaster position="top-center" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        style={{ display: "none" }}
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
                label="อีเมล"
                value={email || "-"}
              />

              {/* Password */}
              {isEditingPassword ? (
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
                  <HiOutlineLockClosed className="text-3xl mt-1" />
                  <div className="flex-grow flex flex-col gap-3">
                    <p className="text-sm font-semibold">เปลี่ยนรหัสผ่าน</p>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordFields.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="รหัสผ่านปัจจุบัน"
                      className="text-sm w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                    />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordFields.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="รหัสผ่านใหม่"
                      className="text-sm w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordFields.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      className="text-sm w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                    />
                    <div className="flex gap-3 mt-2 self-end">
                      <button
                        onClick={handleSavePassword}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700"
                      >
                        <HiCheck /> บันทึก
                      </button>
                      <button
                        onClick={handleCancelPassword}
                        className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600"
                      >
                        <HiX /> ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <InfoField
                  icon={<HiOutlineLockClosed className="text-3xl" />}
                  label="รหัสผ่าน"
                  value="••••••••••••"
                  actionText="เปลี่ยนรหัสผ่าน"
                  onActionClick={handleEditPasswordClick}
                />
              )}

              {/* Username */}
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
                  value={username || "-"}
                  actionText="เปลี่ยนชื่อผู้ใช้"
                  onActionClick={() => {
                    setTempUsername(username);
                    setIsEditingUsername(true);
                  }}
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
