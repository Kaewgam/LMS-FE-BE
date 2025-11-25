"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  HiOutlineMail,
  HiOutlineEmojiHappy,
  HiCheck,
  HiX,
  HiOutlinePresentationChartLine,
  HiOutlineLightBulb,
  HiOutlinePlus,
  HiOutlineTrash,
  HiPencil,
  HiOutlineLockClosed,
} from "react-icons/hi";
import { FaGraduationCap } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { API_BASE } from "@/lib/api";
// ===== API functions =====
import {
  getMe,
  updateMe,
  updateProfileImage,
  changePassword,
  listEducations,
  createEducation,
  updateEducation as apiUpdateEducation,
  deleteEducation as apiDeleteEducation,
  listTeachings,
  createTeaching,
  updateTeaching as apiUpdateTeaching,
  deleteTeaching as apiDeleteTeaching,
  type EducationDTO,
  type TeachingDTO,
} from "@/lib/api";

// ===== Local UI types =====
interface Education {
  id: string;
  level: string;
  university: string;
  startYear: string;
  endYear: string; // 'ปัจจุบัน' หรือปี
}
interface TeachingExperience {
  id: string;
  topic: string;
  description: string;
  startYear: string;
  endYear: string; // 'ปัจจุบัน' หรือปี
}

// ===== SVG avatar =====
const CustomProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
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

// ===== Reusable Field =====
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
          <p className="text-sm mt-2 whitespace-pre-line">{value}</p>
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

// ===== Profile picture card =====
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

// ===== react-select styles =====
const customStyles = {
  control: (provided: any, state: { isFocused: boolean }) => ({
    ...provided,
    border: state.isFocused ? "1px solid black" : "1px solid #cbd5e1",
    borderRadius: "0.375rem",
    padding: "2px",
    boxShadow: state.isFocused ? "0 0 0 1px black" : "none",
    "&:hover": { borderColor: "black" },
  }),
  option: (
    provided: any,
    state: { isSelected: boolean; isFocused: boolean }
  ) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "black"
      : state.isFocused
      ? "#f1f5f9"
      : "white",
    color: state.isSelected ? "white" : "black",
  }),
};

// ===== Education form =====
interface EducationFormProps {
  educationData: Omit<Education, "id">;
  onDataChange: (data: Omit<Education, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
  levelOptions: { value: string; label: string }[];
  yearOptions: { value: string; label: string }[];
}
const EducationForm: React.FC<EducationFormProps> = ({
  educationData,
  onDataChange,
  onSave,
  onCancel,
  levelOptions,
  yearOptions,
}) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
    <FaGraduationCap className="text-3xl self-start" />
    <div className="flex-grow flex flex-col gap-2">
      <div className="flex flex-col gap-3 mt-2">
        <div>
          <label className="text-xs font-medium text-slate-600">
            ระดับการศึกษา
          </label>
          <Select
            value={levelOptions.find((o) => o.value === educationData.level)}
            onChange={(o) =>
              onDataChange({ ...educationData, level: o?.value || "" })
            }
            options={levelOptions}
            styles={customStyles}
            instanceId="education-level-select"
            className="text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">
            มหาวิทยาลัย
          </label>
          <input
            type="text"
            value={educationData.university}
            onChange={(e) =>
              onDataChange({ ...educationData, university: e.target.value })
            }
            className="text-sm mt-1 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
            placeholder="ชื่อมหาวิทยาลัย"
          />
        </div>
        <div className="flex gap-4 w-full">
          <div className="w-1/2">
            <label className="text-xs font-medium text-slate-600">
              ปีที่เริ่ม
            </label>
            <Select
              value={yearOptions.find(
                (o) => o.value === educationData.startYear
              )}
              onChange={(o) =>
                onDataChange({ ...educationData, startYear: o?.value || "" })
              }
              options={yearOptions}
              styles={customStyles}
              instanceId="start-year-select"
              className="text-sm mt-1"
            />
          </div>
          <div className="w-1/2">
            <label className="text-xs font-medium text-slate-600">
              ปีที่จบ
            </label>
            <Select
              value={yearOptions.find((o) => o.value === educationData.endYear)}
              onChange={(o) =>
                onDataChange({ ...educationData, endYear: o?.value || "" })
              }
              options={yearOptions}
              styles={customStyles}
              instanceId="end-year-select"
              className="text-sm mt-1"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4 self-end">
        <button
          onClick={onSave}
          className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700"
        >
          <HiCheck /> บันทึก
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600"
        >
          <HiX /> ยกเลิก
        </button>
      </div>
    </div>
  </div>
);

// ===== Teaching form =====
interface TeachingFormProps {
  teachingData: Omit<TeachingExperience, "id">;
  onDataChange: (data: Omit<TeachingExperience, "id">) => void;
  onSave: () => void;
  onCancel: () => void;
  yearOptions: { value: string; label: string }[];
  endYearOptions: { value: string; label: string }[];
}
const TeachingForm: React.FC<TeachingFormProps> = ({
  teachingData,
  onDataChange,
  onSave,
  onCancel,
  yearOptions,
  endYearOptions,
}) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
    <HiOutlinePresentationChartLine className="text-3xl self-start" />
    <div className="flex-grow flex flex-col gap-2">
      <div className="flex flex-col gap-3 mt-2">
        <div>
          <label className="text-xs font-medium text-slate-600">หัวข้อ</label>
          <input
            type="text"
            value={teachingData.topic}
            onChange={(e) =>
              onDataChange({ ...teachingData, topic: e.target.value })
            }
            className="text-sm mt-1 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
            placeholder="เช่น ภาษาอังกฤษเพื่อการสื่อสาร"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">คำอธิบาย</label>
          <textarea
            value={teachingData.description}
            onChange={(e) =>
              onDataChange({ ...teachingData, description: e.target.value })
            }
            className="text-sm mt-1 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
            rows={3}
            placeholder="อธิบายรายละเอียดการสอน"
          />
        </div>
        <div className="flex gap-4 w-full">
          <div className="w-1/2">
            <label className="text-xs font-medium text-slate-600">
              ปีที่เริ่ม
            </label>
            <Select
              value={yearOptions.find(
                (o) => o.value === teachingData.startYear
              )}
              onChange={(o) =>
                onDataChange({ ...teachingData, startYear: o?.value || "" })
              }
              options={yearOptions}
              styles={customStyles}
              instanceId="teaching-start-year-select"
              className="text-sm mt-1"
            />
          </div>
          <div className="w-1/2">
            <label className="text-xs font-medium text-slate-600">
              ปีที่สิ้นสุด
            </label>
            <Select
              value={endYearOptions.find(
                (o) => o.value === teachingData.endYear
              )}
              onChange={(o) =>
                onDataChange({ ...teachingData, endYear: o?.value || "" })
              }
              options={endYearOptions}
              styles={customStyles}
              instanceId="teaching-end-year-select"
              className="text-sm mt-1"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4 self-end">
        <button
          onClick={onSave}
          className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700"
        >
          <HiCheck /> บันทึก
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600"
        >
          <HiX /> ยกเลิก
        </button>
      </div>
    </div>
  </div>
);

// ===== Main Page =====
const SettingsPage = () => {
  // Me
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  // Bio (มองเป็น motto)
  const [motto, setMotto] = useState<string>("");
  const [isEditingMotto, setIsEditingMotto] = useState(false);
  const [tempMotto, setTempMotto] = useState("");

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Educations
  const [educations, setEducations] = useState<Education[]>([]);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState<string | null>(
    null
  );
  const [tempEducation, setTempEducation] = useState<Omit<Education, "id">>({
    level: "ปริญญาตรี",
    university: "",
    startYear: "2025",
    endYear: "2025",
  });

  // Teachings
  const [teachingExperiences, setTeachingExperiences] = useState<
    TeachingExperience[]
  >([]);
  const [isAddingTeaching, setIsAddingTeaching] = useState(false);
  const [editingTeachingId, setEditingTeachingId] = useState<string | null>(
    null
  );
  const [tempTeaching, setTempTeaching] = useState<
    Omit<TeachingExperience, "id">
  >({ topic: "", description: "", startYear: "2025", endYear: "ปัจจุบัน" });

  // ===== Effects: initial load =====
  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setEmail(me.email || "");
        setUsername(me.full_name || me.email?.split("@")[0] || "");
        setTempUsername(me.full_name || "");
        setMotto(me.bio || "");
        setTempMotto(me.bio || "");
        let url = me.profile_image_url || null;
        if (url && !/^https?:\/\//i.test(url)) url = `${API_BASE}${url}`;
        setProfileImage(url);
      } catch {
        toast.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      }
      try {
        const listEdu = await listEducations();
        setEducations(
          listEdu.map((e: EducationDTO) => ({
            id: e.id,
            level: e.level,
            university: e.university,
            startYear: String(e.start_year),
            endYear: e.end_year === null ? "ปัจจุบัน" : String(e.end_year),
          }))
        );
      } catch {
        // เงียบไว้ / แจ้งเตือนก็ได้
      }
      try {
        const listTeach = await listTeachings();
        setTeachingExperiences(
          listTeach.map((t: TeachingDTO) => ({
            id: t.id,
            topic: t.topic,
            description: t.description,
            startYear: String(t.start_year),
            endYear: t.end_year === null ? "ปัจจุบัน" : String(t.end_year),
          }))
        );
      } catch {
        // เงียบไว้
      }
    })();
  }, []);
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // ===== Handlers: profile image =====
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview); // เคลียร์ URL เดิมก่อน
    setUploadFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  const handleSaveImage = async () => {
    if (!uploadFile) return;
    try {
      await updateProfileImage(uploadFile);

      // refresh me เพื่อเอา URL ล่าสุด
      const me = await getMe();

      // ต่อโดเมนถ้าเป็น path + กัน cache ค้าง
      let url = me.profile_image_url || null;
      if (url && !/^https?:\/\//i.test(url)) url = `${API_BASE}${url}`;
      const busted = url
        ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
        : url;

      setProfileImage(busted);

      // ⬇️ อัปเดต localStorage.me ให้ทันสมัย
      const oldMe = JSON.parse(localStorage.getItem("me") || "null") || {};
      const newMe = { ...oldMe, ...me, profile_image_url: busted };
      localStorage.setItem("me", JSON.stringify(newMe));

      // ⬇️ แจ้งทุกที่ในแอปว่าโปรไฟล์เปลี่ยน (Navbar จะฟังอยู่)
      window.dispatchEvent(new CustomEvent("me:changed", { detail: newMe }));

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

  // ===== Handlers: username =====
  const handleEditUsernameClick = () => {
    setTempUsername(username);
    setIsEditingUsername(true);
  };
  const handleSaveUsername = async () => {
    try {
      await updateMe({ full_name: tempUsername });
      setUsername(tempUsername);
      await updateMe({ full_name: tempUsername });
      setUsername(tempUsername);

      // อัปเดต localStorage + broadcast
      const oldMe = JSON.parse(localStorage.getItem("me") || "null") || {};
      const newMe = { ...oldMe, full_name: tempUsername };
      localStorage.setItem("me", JSON.stringify(newMe));
      window.dispatchEvent(new CustomEvent("me:changed", { detail: newMe }));

      setIsEditingUsername(false);
      toast.success("เปลี่ยนชื่อผู้ใช้สำเร็จ!");
    } catch {
      toast.error("บันทึกชื่อผู้ใช้ไม่สำเร็จ");
    }
  };
  const handleCancelUsername = () => setIsEditingUsername(false);

  // ===== Handlers: password =====
  const handleEditPasswordClick = () => setIsEditingPassword(true);
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFields((prev) => ({ ...prev, [name]: value }));
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

  // ===== Handlers: Education =====
  const currentYear = new Date().getFullYear();
  const handleStartAddingEducation = () => {
    setTempEducation({
      level: "ปริญญาตรี",
      university: "",
      startYear: `${currentYear}`,
      endYear: `${currentYear}`,
    });
    setIsAddingEducation(true);
  };
  const handleAddEducation = async () => {
    if (!tempEducation.university.trim())
      return toast.error("กรุณากรอกชื่อมหาวิทยาลัย");
    try {
      const created = await createEducation({
        level: tempEducation.level,
        university: tempEducation.university,
        start_year: Number(tempEducation.startYear),
        end_year: Number(tempEducation.endYear),
      });
      setEducations((prev) => [
        ...prev,
        {
          id: created.id,
          level: created.level,
          university: created.university,
          startYear: String(created.start_year),
          endYear:
            created.end_year === null ? "ปัจจุบัน" : String(created.end_year),
        },
      ]);
      setIsAddingEducation(false);
      toast.success("เพิ่มประวัติการศึกษาสำเร็จ!");
    } catch {
      toast.error("เพิ่มประวัติการศึกษาไม่สำเร็จ");
    }
  };
  const handleStartEditingEducation = (edu: Education) => {
    setEditingEducationId(edu.id);
    setTempEducation({ ...edu });
  };
  const handleUpdateEducation = async () => {
    if (!editingEducationId || !tempEducation.university.trim()) return;
    try {
      const payload = {
        level: tempEducation.level,
        university: tempEducation.university,
        start_year: Number(tempEducation.startYear),
        end_year:
          tempEducation.endYear === "ปัจจุบัน"
            ? null
            : Number(tempEducation.endYear),
      };
      const updated = await apiUpdateEducation(editingEducationId, payload);
      setEducations((prev) =>
        prev.map((e) =>
          e.id === editingEducationId
            ? {
                id: updated.id,
                level: updated.level,
                university: updated.university,
                startYear: String(updated.start_year),
                endYear:
                  updated.end_year === null
                    ? "ปัจจุบัน"
                    : String(updated.end_year),
              }
            : e
        )
      );
      setEditingEducationId(null);
      toast.success("อัปเดตข้อมูลสำเร็จ!");
    } catch {
      toast.error("อัปเดตข้อมูลไม่สำเร็จ");
    }
  };
  const handleDeleteEducation = async (id: string) => {
    try {
      await apiDeleteEducation(id);
      setEducations((prev) => prev.filter((e) => e.id !== id));
      toast.success("ลบข้อมูลสำเร็จ!");
    } catch {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };
  const handleCancelEducation = () => {
    setIsAddingEducation(false);
    setEditingEducationId(null);
  };

  // ===== Handlers: Teaching =====
  const handleStartAddingTeaching = () => {
    setTempTeaching({
      topic: "",
      description: "",
      startYear: `${currentYear}`,
      endYear: "ปัจจุบัน",
    });
    setIsAddingTeaching(true);
  };
  const handleAddTeaching = async () => {
    if (!tempTeaching.topic.trim()) return toast.error("กรุณากรอกหัวข้อการสอน");
    try {
      const created = await createTeaching({
        topic: tempTeaching.topic,
        description: tempTeaching.description,
        start_year: Number(tempTeaching.startYear),
        end_year:
          tempTeaching.endYear === "ปัจจุบัน"
            ? null
            : Number(tempTeaching.endYear),
      });
      setTeachingExperiences((prev) => [
        ...prev,
        {
          id: created.id,
          topic: created.topic,
          description: created.description,
          startYear: String(created.start_year),
          endYear:
            created.end_year === null ? "ปัจจุบัน" : String(created.end_year),
        },
      ]);
      setIsAddingTeaching(false);
      toast.success("เพิ่มประวัติการสอนสำเร็จ!");
    } catch {
      toast.error("เพิ่มประวัติการสอนไม่สำเร็จ");
    }
  };
  const handleStartEditingTeaching = (exp: TeachingExperience) => {
    setEditingTeachingId(exp.id);
    setTempTeaching({ ...exp });
  };
  const handleUpdateTeaching = async () => {
    if (!editingTeachingId || !tempTeaching.topic.trim()) return;
    try {
      const updated = await apiUpdateTeaching(editingTeachingId, {
        topic: tempTeaching.topic,
        description: tempTeaching.description,
        start_year: Number(tempTeaching.startYear),
        end_year:
          tempTeaching.endYear === "ปัจจุบัน"
            ? null
            : Number(tempTeaching.endYear),
      });
      setTeachingExperiences((prev) =>
        prev.map((t) =>
          t.id === editingTeachingId
            ? {
                id: updated.id,
                topic: updated.topic,
                description: updated.description,
                startYear: String(updated.start_year),
                endYear:
                  updated.end_year === null
                    ? "ปัจจุบัน"
                    : String(updated.end_year),
              }
            : t
        )
      );
      setEditingTeachingId(null);
      toast.success("อัปเดตข้อมูลสำเร็จ!");
    } catch {
      toast.error("อัปเดตข้อมูลไม่สำเร็จ");
    }
  };
  const handleDeleteTeaching = async (id: string) => {
    try {
      await apiDeleteTeaching(id);
      setTeachingExperiences((prev) => prev.filter((t) => t.id !== id));
      toast.success("ลบข้อมูลสำเร็จ!");
    } catch {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };
  const handleCancelTeaching = () => {
    setIsAddingTeaching(false);
    setEditingTeachingId(null);
  };

  // ===== Years/options =====
  const years = Array.from(
    { length: new Date().getFullYear() - 1979 },
    (_, i) => new Date().getFullYear() - i
  );
  const yearOptions = years.map((y) => ({
    value: String(y),
    label: String(y),
  }));
  const levelOptions = [
    { value: "ปริญญาตรี", label: "ปริญญาตรี" },
    { value: "ปริญญาโท", label: "ปริญญาโท" },
    { value: "ปริญญาเอก", label: "ปริญญาเอก" },
  ];
  const teachingEndYearOptions = [
    { value: "ปัจจุบัน", label: "ปัจจุบัน" },
    ...yearOptions,
  ];

  return (
    <>
      <Toaster position="top-center" />

      <div className="mb-15 bg-white min-h-screen p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-semibold text-slate-800">
              การตั้งค่า
            </h1>
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
                  onActionClick={() => setIsEditingPassword(true)}
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
                  onActionClick={handleEditUsernameClick}
                />
              )}

              {/* Educations */}
              <div className="bg-white p-4 rounded-xl border-2 border-black w-full space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <FaGraduationCap className="text-3xl" />
                    <p className="text-sm font-semibold">ประวัติการศึกษา</p>
                  </div>
                  {!isAddingEducation && editingEducationId === null && (
                    <button
                      onClick={handleStartAddingEducation}
                      className="flex items-center cursor-pointer gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <HiOutlinePlus />
                      เพิ่ม
                    </button>
                  )}
                </div>

                {educations.map((edu) => (
                  <div key={edu.id}>
                    {editingEducationId === edu.id ? (
                      <EducationForm
                        educationData={tempEducation}
                        onDataChange={setTempEducation}
                        onSave={handleUpdateEducation}
                        onCancel={handleCancelEducation}
                        levelOptions={levelOptions}
                        yearOptions={yearOptions}
                      />
                    ) : (
                      <div className="pl-11 flex justify-between items-start border-t pt-4">
                        <div>
                          <p className="font-semibold">{edu.level}</p>
                          <p className="text-slate-600">{edu.university}</p>
                          <p className="text-slate-500 text-xs mt-1">{`(${edu.startYear} - ${edu.endYear})`}</p>
                        </div>
                        <div className="flex gap-3">
                          <HiPencil
                            onClick={() => {
                              setEditingEducationId(edu.id);
                              setTempEducation({ ...edu });
                            }}
                            className="cursor-pointer text-slate-500 hover:text-slate-800"
                          />
                          <HiOutlineTrash
                            onClick={() => handleDeleteEducation(edu.id)}
                            className="cursor-pointer text-red-500 hover:text-red-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isAddingEducation && (
                  <div className="border-t pt-4">
                    <EducationForm
                      educationData={tempEducation}
                      onDataChange={setTempEducation}
                      onSave={handleAddEducation}
                      onCancel={handleCancelEducation}
                      levelOptions={levelOptions}
                      yearOptions={yearOptions}
                    />
                  </div>
                )}
              </div>

              {/* Teachings */}
              <div className="bg-white p-4 rounded-xl border-2 border-black w-full space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <HiOutlinePresentationChartLine className="text-3xl" />
                    <p className="text-sm font-semibold">ประวัติการสอน</p>
                  </div>
                  {!isAddingTeaching && editingTeachingId === null && (
                    <button
                      onClick={handleStartAddingTeaching}
                      className="flex cursor-pointer items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <HiOutlinePlus />
                      เพิ่ม
                    </button>
                  )}
                </div>

                {teachingExperiences.map((exp) => (
                  <div key={exp.id}>
                    {editingTeachingId === exp.id ? (
                      <TeachingForm
                        teachingData={tempTeaching}
                        onDataChange={setTempTeaching}
                        onSave={handleUpdateTeaching}
                        onCancel={handleCancelTeaching}
                        yearOptions={yearOptions}
                        endYearOptions={teachingEndYearOptions}
                      />
                    ) : (
                      <div className="pl-11 flex justify-between items-start border-t pt-4">
                        <div>
                          <p className="font-semibold">{exp.topic}</p>
                          <p className="text-slate-600 whitespace-pre-line">
                            {exp.description}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">{`(${exp.startYear} - ${exp.endYear})`}</p>
                        </div>
                        <div className="flex gap-3">
                          <HiPencil
                            onClick={() => {
                              setEditingTeachingId(exp.id);
                              setTempTeaching({ ...exp });
                            }}
                            className="cursor-pointer text-slate-500 hover:text-slate-800"
                          />
                          <HiOutlineTrash
                            onClick={() => handleDeleteTeaching(exp.id)}
                            className="cursor-pointer text-red-500 hover:text-red-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isAddingTeaching && (
                  <div className="border-t pt-4">
                    <TeachingForm
                      teachingData={tempTeaching}
                      onDataChange={setTempTeaching}
                      onSave={handleAddTeaching}
                      onCancel={handleCancelTeaching}
                      yearOptions={yearOptions}
                      endYearOptions={teachingEndYearOptions}
                    />
                  </div>
                )}
              </div>

              {/* Motto/Bio */}
              {isEditingMotto ? (
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-black w-full">
                  <HiOutlineLightBulb className="text-3xl self-start" />
                  <div className="flex-grow flex flex-col gap-2">
                    <p className="text-sm font-semibold">คติประจำใจ</p>
                    <textarea
                      value={tempMotto}
                      onChange={(e) => setTempMotto(e.target.value)}
                      className="text-sm mt-2 w-full rounded-md border border-slate-300 p-2 focus:outline-none focus:ring focus:ring-black transition"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-3 mt-2 self-end">
                      <button
                        onClick={async () => {
                          try {
                            await updateMe({ bio: tempMotto });
                            setMotto(tempMotto);
                            setIsEditingMotto(false);
                            toast.success("อัปเดตคติประจำใจสำเร็จ!");
                          } catch {
                            toast.error("บันทึกคติประจำใจไม่สำเร็จ");
                          }
                        }}
                        className="flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-green-700"
                      >
                        <HiCheck /> บันทึก
                      </button>
                      <button
                        onClick={() => setIsEditingMotto(false)}
                        className="flex items-center gap-1 bg-slate-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-slate-600"
                      >
                        <HiX /> ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <InfoField
                  icon={<HiOutlineLightBulb className="text-3xl" />}
                  label="คติประจำใจ"
                  value={motto || "-"}
                  actionText="แก้ไข"
                  onActionClick={() => {
                    setTempMotto(motto);
                    setIsEditingMotto(true);
                  }}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />
    </>
  );
};

export default SettingsPage;
