"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FaCertificate,
  FaPalette,
  FaChalkboardTeacher,
  FaSave,
  FaAward,
  FaFeatherAlt,
  FaChevronDown,
  FaArrowLeft,
} from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { api, saveCertificateTemplateAndIssueForCompleted } from "@/lib/api";

// --- Certificate Template Component ---
type TemplateType = "classic" | "modern" | "minimalist";

interface CertificateProps {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  template: TemplateType;
  primaryColor: string;
  secondaryColor: string;
}

const CertificateDisplay: React.FC<CertificateProps> = ({
  studentName,
  courseName,
  instructorName,
  completionDate,
  template,
  primaryColor,
  secondaryColor,
}) => {
  const text = {
    title: "ใบประกาศนียบัตร",
    presentedTo: "มอบให้ไว้เพื่อแสดงว่า",
    completionMessage: "ได้สำเร็จการศึกษาตามหลักสูตร",
    instructor: "ผู้สอน",
    completionDate: "วันที่สำเร็จการศึกษา",
    leadInstructor: "อาจารย์ผู้สอน",
  } as const;

  const CertificateSeal = () => (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        <circle
          cx="100"
          cy="100"
          r="95"
          fill={primaryColor}
          fillOpacity="0.1"
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke={primaryColor}
          strokeWidth="2"
          fill="none"
        />
        <text
          x="100"
          y="75"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={primaryColor}
        >
          เกียรติบัตร
        </text>
        <text
          x="100"
          y="135"
          textAnchor="middle"
          fontSize="22"
          fontWeight="bold"
          fill={primaryColor}
        >
          รับรอง
        </text>
      </svg>
      <FaAward
        className="absolute inset-0 m-auto text-5xl"
        style={{ color: primaryColor }}
      />
    </div>
  );

  if (template === "modern") {
    return (
      <div className="w-full aspect-[1.414] shadow-lg flex transition-all duration-300 rounded-lg overflow-hidden bg-white border border-gray-300">
        <div
          style={{ backgroundColor: primaryColor }}
          className="w-1/4 h-full flex items-center justify-center p-4"
        >
          <CertificateSeal />
        </div>
        <div className="w-3/4 flex flex-col justify-between items-center text-center p-8">
          <div>
            <p
              className="text-2xl font-semibold tracking-wide mb-5"
              style={{ color: secondaryColor }}
            >
              {text.title}
            </p>
            <div
              className="my-3 w-50 h-0.5 mx-auto mb-5"
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-md mb-5" style={{ color: secondaryColor }}>
              {text.presentedTo}
            </p>
            <h1
              className="text-4xl font-semibold my-4 mb-5"
              style={{ color: primaryColor }}
            >
              {studentName}
            </h1>
            <p className="text-md mb-5" style={{ color: secondaryColor }}>
              {text.completionMessage}
            </p>
            <h2
              className="text-2xl font-semibold mt-1"
              style={{ color: primaryColor }}
            >
              {courseName || "[ชื่อหลักสูตร]"}
            </h2>
          </div>
          <div
            className="w-full flex justify-between items-end mt-6 text-sm"
            style={{ color: secondaryColor }}
          >
            <div className="text-center">
              <p
                className="font-bold border-b-2 pb-2 "
                style={{ borderColor: primaryColor }}
              >
                {instructorName || "[ชื่อผู้สอน]"}
              </p>
              <p className="mt-2">{text.instructor}</p>
            </div>
            <div className="text-center">
              <p
                className="font-bold border-b-2 pb-2 "
                style={{ borderColor: primaryColor }}
              >
                {completionDate}
              </p>
              <p className="mt-2">{text.completionDate}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "minimalist") {
    return (
      <div className="w-full aspect-[1.414] shadow-lg bg-white p-10 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border border-gray-100">
        <div
          className="absolute top-0 left-0 w-1.5 h-full"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute bottom-0 right-0 w-full h-1.5"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="w-full flex justify-between items-start">
          <div>
            <h2
              className="text-3xl font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              {courseName || "[ชื่อหลักสูตร]"}
            </h2>
            <p className="text-lg" style={{ color: secondaryColor }}>
              {text.title}
            </p>
          </div>
          <FaFeatherAlt
            className="text-5xl"
            style={{ color: primaryColor, opacity: 0.7 }}
          />
        </div>
        <div className="w-full my-8 text-left">
          <p className="text-md mb-3" style={{ color: secondaryColor }}>
            {text.presentedTo}
          </p>
          <h1
            className="text-4xl font-semibold my-3 mb-3"
            style={{ color: primaryColor }}
          >
            {studentName}
          </h1>
          <p className="max-w-xl text-md" style={{ color: secondaryColor }}>
            {text.completionMessage}เป็นที่เรียบร้อย
          </p>
        </div>
        <div
          className="w-full flex justify-between items-end"
          style={{ color: secondaryColor }}
        >
          <div className="text-left">
            <p
              className="font-bold text-lg border-b-2 pb-2"
              style={{ borderColor: primaryColor }}
            >
              {instructorName || "[ชื่อผู้สอน]"}
            </p>
            <p className=" text-sm text-center mt-2">{text.leadInstructor}</p>
          </div>
          <div className="text-left">
            <p
              className="font-bold text-lg border-b-2 pb-2"
              style={{ borderColor: primaryColor }}
            >
              {completionDate}
            </p>
            <p className=" text-sm text-center mt-2">{text.completionDate}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default (classic)
  return (
    <div
      className="w-full aspect-[1.414] shadow-lg flex flex-col justify-between items-center transition-all duration-300 p-10"
      style={{
        border: `12px double ${primaryColor}`,
        backgroundColor: "#ffffffff",
      }}
    >
      <div className="text-center">
        <p
          className="text-2xl font-semibold tracking-widest"
          style={{ color: secondaryColor }}
        >
          {text.title}
        </p>
        <div
          className="my-4 w-60 h-1 mx-auto"
          style={{ backgroundColor: primaryColor }}
        />
        <p className="text-md mt-6" style={{ color: secondaryColor }}>
          {text.presentedTo}
        </p>
        <h1
          className="text-4xl font-semibold my-6"
          style={{ color: primaryColor }}
        >
          {studentName}
        </h1>
        <p className="text-md" style={{ color: secondaryColor }}>
          {text.completionMessage}
        </p>
        <h2
          className="text-2xl font-semibold mt-4"
          style={{ color: primaryColor }}
        >
          {courseName || "[ชื่อหลักสูตร]"}
        </h2>
      </div>
      <div
        className="w-full flex justify-between items-end mt-8"
        style={{ color: secondaryColor }}
      >
        <div className="text-center">
          <p
            className="font-semibold text-lg pb-2 border-b-2 "
            style={{ borderColor: primaryColor }}
          >
            {instructorName || "[ชื่อผู้สอน]"}
          </p>
          <p className="text-sm mt-2">{text.instructor}</p>
        </div>
        <div className="text-center">
          <p
            className="font-semibold text-lg pb-2 border-b-2"
            style={{ borderColor: primaryColor }}
          >
            {completionDate}
          </p>
          <p className="text-sm mt-2">{text.completionDate}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const CertificateTemplatePage: React.FC = () => {
  const allPalettes = [
    { name: "Academic Maroon", primary: "#881337", secondary: "#1f2937" },
    { name: "Elegant Gold", primary: "#b48c2c", secondary: "#422e03" },
    { name: "Official Blue", primary: "#1e40af", secondary: "#334155" },
    { name: "Charcoal Slate", primary: "#1e293b", secondary: "#475569" },
    { name: "Modern Mint", primary: "#0d9488", secondary: "#1e293b" },
  ];

  const templateOptions = [
    { value: "classic", label: "Classic (คลาสสิก)" },
    { value: "minimalist", label: "Minimalist (เรียบหรู)" },
    { value: "modern", label: "Modern (ทันสมัย)" },
  ];

  const [courseName, setCourseName] = useState(
    "การพัฒนาเว็บแอปพลิเคชันขั้นสูง"
  );
  const [instructorName, setInstructorName] = useState("กิ่งฟ้า คล้ายสวน");
  const [template, setTemplate] = useState<TemplateType>("classic");
  const [primaryColor, setPrimaryColor] = useState(allPalettes[0].primary);
  const [secondaryColor, setSecondaryColor] = useState(
    allPalettes[0].secondary
  );
  const [activeTab, setActiveTab] = useState<"design" | "data">("design");

  const search = useSearchParams();
  const courseId = (search.get("courseId") || "").trim();

  // required states
  const [showRequired, setShowRequired] = useState(false);
  const [courseError, setCourseError] = useState("");
  const [instructorError, setInstructorError] = useState("");

  const router = useRouter(); // ✅ 1. เรียกใช้ Router
  const [hasBeenEdited, setHasBeenEdited] = useState(false); // ✅ 2. State เช็คว่ามีการแก้ไขไหม

  // ✅ 3. ฟังก์ชันย้อนกลับอัจฉริยะ
  const smartBack = () => {
    // ถ้ามีการแก้ไขและยังไม่ได้เซฟ ให้เตือนก่อน
    if (hasBeenEdited) {
      const ok = window.confirm(
        "มีการแก้ไขที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?"
      );
      if (!ok) return;
    }

    // Logic การย้อนกลับ
    const from = search.get("from") || search.get("returnTo");
    if (from) {
      try {
        const url = decodeURIComponent(from);
        if (url.startsWith("/")) return router.push(url);
      } catch {}
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      return router.back();
    }
    // Fallback ถ้าไม่รู้จะกลับไปไหน ให้กลับไปหน้าหน้ารายละเอียดคอร์ส หรือหน้าหลัก
    router.push(courseId ? `/course/${courseId}` : "/my-courses");
  };

  function validateInputs() {
    const course = courseName.trim();
    const instr = instructorName.trim();
    let ok = true;
    if (!course) {
      setCourseError("กรอกชื่อคอร์ส/หลักสูตร");
      ok = false;
    }
    if (!instr) {
      setInstructorError("กรอกชื่อผู้สอน/องค์กร");
      ok = false;
    }
    setShowRequired(!ok); // ให้กรอบแดงแสดงทันทีเมื่อกดปุ่ม
    return ok;
  }

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await api.get(
          `/api/courses/${courseId}/certificates/template/`
        );
        const data = res.data ?? {};
        setTemplate((data.style as TemplateType) || "classic");
        setPrimaryColor(data.primary_color || "#881337");
        setSecondaryColor(data.secondary_color || "#1f2937");
        if (data.course_title_override)
          setCourseName(data.course_title_override);
        if (data.issuer_name) setInstructorName(data.issuer_name);
      } catch (e) {
        console.error("โหลด template ไม่สำเร็จ:", e);
      }
    })();
  }, [courseId]);

  const handleTemplateChange = (newTemplate: TemplateType) => {
    setTemplate(newTemplate);
    if (!hasBeenEdited) setHasBeenEdited(true); // ✅ เพิ่มบรรทัดนี้
  };

  const handlePreview = async () => {
    if (!courseId) return toast.error("ไม่พบรหัสคอร์ส");
    if (!validateInputs()) return toast.error("กรอกข้อมูลให้ครบก่อนดูตัวอย่าง");

    try {
      const res = await api.get(
        `/api/courses/${courseId}/certificates/preview/`,
        {
          responseType: "blob",
        }
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) toast.error("โปรดเข้าสู่ระบบก่อนดูตัวอย่าง (401)");
      else if (status === 406)
        toast.error("รูปแบบคำขอไม่ถูกต้อง (406) — Accept: application/pdf");
      else toast.error("เกิดข้อผิดพลาดระหว่างเปิดตัวอย่าง");
    }
  };

  const handleSaveTemplate = async () => {
    if (!courseId) return toast.error("ไม่พบรหัสคอร์ส ไม่สามารถบันทึกได้");
    if (!validateInputs()) return toast.error("กรอกข้อมูลให้ครบก่อนบันทึก");

    const toastId = toast.loading("กำลังบันทึกเทมเพลตและออกใบประกาศ...");

    const payload = {
      style: template,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      course_title_override: courseName,
      issuer_name: instructorName,
      locale: "th",
    } as const;

    try {
      const created = await saveCertificateTemplateAndIssueForCompleted(
        courseId,
        payload
      );
      toast.success(`บันทึกเทมเพลตเรียบร้อย! ออกใบประกาศ `, { id: toastId });
      setHasBeenEdited(false);
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกหรือออกใบประกาศ", { id: toastId });
    }
  };

  const renderDataTab = () => {
    const isCourseInvalid =
      (showRequired && !courseName.trim()) || !!courseError;
    const courseHelper =
      showRequired && !courseName.trim()
        ? "กรอกชื่อคอร์ส/หลักสูตร"
        : courseError;

    const isInstrInvalid =
      (showRequired && !instructorName.trim()) || !!instructorError;
    const instrHelper =
      showRequired && !instructorName.trim()
        ? "กรอกชื่อผู้สอน/องค์กร"
        : instructorError;

    return (
      <div className="space-y-6 animate-fade-in">
        <InputField
          icon={<FaCertificate />}
          label="ชื่อคอร์ส/หลักสูตร"
          value={courseName}
          onChange={(e) => {
            const v = e.target.value;
            setCourseName(v);
            if (showRequired && v.trim()) setCourseError("");
          }}
          invalid={isCourseInvalid}
          helper={courseHelper}
          placeholder="เช่น การพัฒนาเว็บแอปพลิเคชันขั้นสูง"
        />
        <InputField
          icon={<FaChalkboardTeacher />}
          label="ชื่อผู้สอน/องค์กร"
          value={instructorName}
          onChange={(e) => {
            const v = e.target.value;
            setInstructorName(v);
            if (showRequired && v.trim()) setInstructorError("");
          }}
          invalid={isInstrInvalid}
          helper={instrHelper}
          placeholder="เช่น สมชาย กรุงเทพ"
        />
      </div>
    );
  };

  const renderDesignTab = () => (
    <div className="space-y-8 animate-fade-in">
      <ComboBox
        label="รูปแบบเทมเพลต"
        options={templateOptions}
        value={template}
        onChange={(v) => handleTemplateChange(v as TemplateType)}
      />
      <div>
        <label className="block text-md font-semibold text-gray-700 mb-3">
          ชุดสีแนะนำ
        </label>
        <ColorPalettes
          palettes={allPalettes}
          onSelect={(p, s) => {
            setPrimaryColor(p);
            setSecondaryColor(s);
            if (!hasBeenEdited) setHasBeenEdited(true);
          }}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ColorField
          label="สีหลัก"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
        />
        <ColorField
          label="สีรอง (ตัวอักษร)"
          value={secondaryColor}
          onChange={(e) => setSecondaryColor(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            borderRadius: "8px",
            fontSize: "16px",
            padding: "16px 24px",
            fontWeight: "600",
          },
          success: { style: { background: "#F0FDF4", color: "black" } },
          error: { style: { background: "#FFF1F2", color: "black" } },
          loading: { style: { background: "#EFF6FF", color: "black" } },
        }}
      />
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen">
        <header className="mb-8 flex flex-col gap-4">
          {" "}
          {/* ✅ ปรับ style ให้สวยงาม */}
          {/* ✅ ปุ่มย้อนกลับที่เพิ่มเข้ามา */}
          <div>
            <button
              onClick={smartBack}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold"
            >
              <FaArrowLeft /> ย้อนกลับ
            </button>
          </div>
          <h1 className="text-4xl font-semibold  text-slate-800">
            ออกแบบเทมเพลตใบประกาศนียบัตร
          </h1>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <CertificateDisplay
                studentName="[ชื่อ-สกุล ผู้เรียน]"
                courseName={courseName}
                instructorName={instructorName}
                completionDate="[วันที่สำเร็จการศึกษา]"
                template={template}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-300 shadow-lg">
              <div className="flex border-b border-gray-200 mb-6">
                <TabButton
                  icon={<FaPalette />}
                  label="ดีไซน์"
                  isActive={activeTab === "design"}
                  onClick={() => setActiveTab("design")}
                />
                <TabButton
                  icon={<FaCertificate />}
                  label="ข้อมูลคอร์ส"
                  isActive={activeTab === "data"}
                  onClick={() => setActiveTab("data")}
                />
              </div>

              {activeTab === "data" ? renderDataTab() : renderDesignTab()}

              <div className="mt-8 border-t border-slate-200 pt-6">
                {/* ปุ่มกดได้เสมอ (ไม่ disable) */}
                <button
                  onClick={handleSaveTemplate}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-full text-white font-semibold transition-all bg-sky-600 hover:bg-sky-700"
                >
                  <FaSave /> บันทึกเทมเพลต
                </button>
                <button
                  onClick={handlePreview}
                  className="w-full mt-4 flex items-center justify-center gap-3 py-3 px-6 rounded-full text-white font-semibold transition-all bg-gray-600 hover:bg-gray-700"
                >
                  <FaCertificate /> ดูตัวอย่างใบประกาศ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- Helper Components ---
const InputField = ({
  icon,
  label,
  invalid,
  helper,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  invalid?: boolean;
  helper?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="flex items-center gap-2 text-md font-semibold text-gray-700 mb-2">
      {icon}
      {label}
    </label>
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`p-3 w-full border rounded-lg text-sm focus:outline-none focus:ring-1 transition ${
        invalid
          ? "border-red-500 focus:ring-red-500"
          : "border-gray-300 focus:ring-gray-300"
      }`}
    />
    {helper ? <p className="text-red-500 text-xs mt-1">{helper}</p> : null}
  </div>
);

const ColorField = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-md font-semibold text-gray-700 mb-2">
      {label}
    </label>
    <div className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg focus-within:ring-1 focus-within:ring-gray-300 transition">
      <input
        type="color"
        {...props}
        className="w-8 h-8 p-0 border-none rounded cursor-pointer"
        style={{ backgroundColor: "transparent" }}
      />
      <input
        type="text"
        {...props}
        className="w-full border-none p-0 text-sm focus:ring-0 focus:outline-none"
      />
    </div>
  </div>
);

const ComboBox = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-md font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-full cursor-pointer rounded-lg bg-white p-3 pr-10 text-left border border-gray-300 transition ${
          isOpen ? "ring-1 ring-gray-300" : ""
        }`}
      >
        <span className="block truncate">{selectedOption?.label || ""}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <FaChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
      {isOpen && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg focus:outline-none sm:text-sm">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="text-gray-900 relative cursor-pointer select-none py-2 px-4 hover:bg-gray-100 transition-colors"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TabButton = ({
  icon,
  label,
  isActive,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 text-sm font-semibold transition-colors rounded-t-md cursor-pointer ${
      isActive
        ? "border-b-2 border-sky-600 text-sky-600"
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {icon}
    {label}
  </button>
);

const ColorPalettes = ({
  palettes,
  onSelect,
}: {
  palettes: { name: string; primary: string; secondary: string }[];
  onSelect: (primary: string, secondary: string) => void;
}) => (
  <div className="flex flex-wrap gap-3">
    {palettes.map((p) => (
      <button
        key={p.name}
        onClick={() => onSelect(p.primary, p.secondary)}
        title={p.name}
        className="flex items-center gap-2 p-1.5 border-2 border-transparent rounded-full hover:border-sky-500 transition cursor-pointer"
      >
        <div
          className="w-6 h-6 rounded-full"
          style={{ backgroundColor: p.primary }}
        />
        <div
          className="w-5 h-5 rounded-full ring-1 ring-inset ring-slate-200"
          style={{ backgroundColor: p.secondary }}
        />
      </button>
    ))}
  </div>
);

export default CertificateTemplatePage;
