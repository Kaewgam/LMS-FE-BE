import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// Import คอมโพเนนต์ Wrapper ทั้งสองตัว
import SidebarWrapper from "./components/SidebarWrapper";
import NavbarWrapper from "./components/NavbarWrapper";

// ส่วนของการตั้งค่า Font (เหมือนเดิม)
const LINESeedSansTH = localFont({
  src: [
    { path: "../../public/fonts/LINESeedSansTH_W_Rg.woff2", weight: "400", style: "thin" },
    { path: "../../public/fonts/LINESeedSansTH_W_Rg.woff2", weight: "500", style: "regular" },
    { path: "../../public/fonts/LINESeedSansTH_W_Bd.woff2", weight: "600", style: "bold" },
    { path: "../../public/fonts/LINESeedSansTH_W_XBd.woff2", weight: "700", style: "extrabold" },
    { path: "../../public/fonts/LINESeedSansTH_W_He.woff2", weight: "800", style: "heavy" },
  ],
  variable: "--font-lineseedsansth",
  display: "swap",
});

// ส่วนของ Metadata (เหมือนเดิม)
export const metadata: Metadata = {
  title: "LMS-Application",
  description: "lms-application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={LINESeedSansTH.className}>
        <Toaster/>

         <NavbarWrapper>
              <SidebarWrapper>
         
                {children}
          
              </SidebarWrapper>
            </NavbarWrapper>
      </body>
    </html>
  );
}