"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from "react-icons/fc";
// import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  // const { user, loading, logout, triggerGoogleLogin } = useAuth();

  const getFirstName = (fullName: string | undefined): string => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-primary text-white">
      <Link href="/" className='text-2xl font-medium bg-primary text-white px-4 py-2 rounded-md'>
        LMS App
      </Link>
      <div>
        {false ? (
          <span>Loading...</span>
        ) : true ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Avatar>
              <AvatarImage src={'https://github.com/shadcn.png'}/>
              <AvatarFallback>
                {getFirstName('สมชาย สมหญิง')}
              </AvatarFallback>
            </Avatar>
            <span>สวัสดี, สมชาย สมหญิง</span>
            <Badge variant='secondary'>
              Admin
            </Badge>
            <button onClick={() => {}} style={{ cursor: 'pointer' }} className='flex items-center gap-2 border-[1px] border-gray-300 rounded-md p-2'>
              <LogOut className='w-4 h-4' />
              <span className='text-sm'>Logout</span>
            </button>
          </div>
        ) : (
          <button onClick={() => toast.success('Logged with Google')} style={{ cursor: 'pointer' }} className='flex items-center gap-2 border-[1px] border-gray-300 rounded-md p-2'>
            <FcGoogle className='w-4 h-4' />
            <span className='text-sm'>Login with Google</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;