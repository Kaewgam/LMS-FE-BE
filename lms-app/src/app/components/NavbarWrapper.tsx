'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import NavbarAdmin from './NavbarAdmin'; 
import NavbarStd from './NavbarStd'; 
import NavbarHomepage from './NavbarHomepage';
import NavbarSystem from './NavbarSystem';
import NavbarTeacher from './NavbarTeacher';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // --- รายการ Path สำหรับแต่ละ Navbar ---
  const adminNavbarPaths = [
    '/admin/settings_admin',
    '/admin/listusers',
    '/admin/listorganizations',
    '/admin/notification_admin',
    '/admin/documents_admin',
    '/admin/support',
    '/admin/logout',
    '/admin/handleinstitutions'
  ];

  const stdNavbarPaths = [
    '/home', 
    '/in-house-training', 
    '/in-house-training/form-in-house-training', 
    '/student/course', 
    '/student/course/digital-and-business-marketing-course', 
    '/student/course/design-course', 
    '/student/course/data-course', 
    '/student/course/all-course', 
    '/bootcamp', 
    '/student/course-details', 
    '/student/course-details/quiz',
    '/student/profile',
    '/student/logout',
    '/student/documents_student',
    '/student/support',
    '/student/my_courses',
    '/student/my_favorite_course',
    '/student/review_platform',
    '/student/course-details/quiz/certificate',
    '/student/q&a/chat/1',
    '/student/all_notifications',
    '/student/settings_student',
    '/student/q&a/chat/new',
    '/student/notifications_student/details/2',
    '/student/notifications_student/details/3',
    '/student/certificate'

  ];
  
  const homepageNavbarPaths = [
    '/register',
    '/login',
    '/forgot-password',
    '/reset-password',
    '/home', 
    '/in-house-training', 
    '/in-house-training/form-in-house-training', 
    '/student/course', 
    '/student/course/digital-and-business-marketing-course', 
    '/student/course/design-course', 
    '/student/course/data-course', 
    '/student/course/all-course', 
    '/bootcamp', 
    '/student/course-details', 
  ]; 

  const systemNavbarPaths = [
    '/universities-staff/add-curriculum',
    '/universities-staff/management-course',
    '/universities-staff/add-course',
    '/universities-staff/management-curriculum',
    '/universities-staff/documents_universities-staff',
    '/universities-staff/support',
    '/universities-staff/logout',
    '/universities-staff/settings_universities-staff',
    '/universities-staff/profile',
    '/universities-staff/all_notifications',
    '/universities-staff/notifications_universities-staff/details/1',
    '/universities-staff/listusers',
    '/universities-staff/listorganizations'
  ];

  const teacherNavbarPaths = [
    '/my-courses', 
    '/add-courses',
    '/edit-courses',
    '/edit-lesson',
    '/edit-assignment',
    '/assignment-details',
    '/submission',
    '/edit-quiz',
    '/edit-scoring-criteria',
    '/instructor/logout',
    '/instructor/support',
    '/instructor/documents_instructor',
    '/instructor/settings_instructor',
    '/instructor/students',
    '/instructor/profile',
    '/instructor/all_notifications',
    '/instructor/q&a/chat/1',
    '/instructor/notifications_instructor/details/3',
    '/edit-certificate'
  ];

  // --- ตรรกะการเลือก Navbar ---
  let currentNavbar = null;

  if (adminNavbarPaths.includes(pathname)) {
    currentNavbar = <NavbarAdmin />;
  } else if (stdNavbarPaths.includes(pathname)) {
    currentNavbar = <NavbarStd />;
  } 
  else if (homepageNavbarPaths.includes(pathname)) {
    currentNavbar = <NavbarHomepage />;
  } else if (systemNavbarPaths.includes(pathname)) {
    currentNavbar = <NavbarSystem />;
  } else if (teacherNavbarPaths.includes(pathname)) {
    currentNavbar = <NavbarTeacher />;
  }

  return (
    <>
      {currentNavbar}
      <main>{children}</main>
    </>
  );
}
