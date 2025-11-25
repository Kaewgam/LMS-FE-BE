"use client";

import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';


const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

interface User {
  pk: string;
  email: string;
  full_name: string;
  is_staff: boolean;
  profile_image_url: string|null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  triggerGoogleLogin: () => void;
  api: typeof api;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // const router = useRouter();

  // ฟังก์ชัน Logout (ใช้ได้ทั้งสองกรณี)
  const logout = () => {
    sessionStorage.removeItem('access');
    sessionStorage.removeItem('refresh');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logout successful');
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/user/');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Could not fetch user, token might be invalid.", error);
      return null;
    }
  };

  const loginWithGoogle = async (authCode: string) => {
    try {
      const response = await api.post('/auth/google/', { code: authCode });
      const { access, refresh } = response.data;
      
      console.log("response from loginWithGoogle", response.data);

      sessionStorage.setItem('access', access);
      sessionStorage.setItem('refresh', refresh);

      console.log("access from loginWithGoogle", access);
      console.log("refresh from loginWithGoogle", refresh);

      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;

      await fetchUser();
      toast.success('Login successful');
    } catch (error) {
       if (axios.isAxiosError(error) && error.response?.status === 403) {
           const message = error.response.data.message || 'คุณไม่มีสิทธิ์เข้าใช้งานระบบ';
          //  router.push(`/permission-denied?message=${encodeURIComponent(message)}`);
          toast.error(message);
       } else {
           console.error("Login failed", error);
           toast.error('Login failed');
       }
    }
  };
  
  const googleLoginFlow = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (codeResponse) => loginWithGoogle(codeResponse.code),
    onError: (error) => {
      console.error('Google Login Error:', error);
      toast.error('Google Login Error');
    },
  });

 
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async (error) => {
        const originalRequest = error.config;
        
        // เงื่อนไข: เป็น 401, URL ไม่ใช่การขอ token ใหม่, และยังไม่เคยลองซ้ำ
        if (error.response.status === 401 && originalRequest.url !== '/token/refresh/' && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = sessionStorage.getItem('refresh');

          console.log("refreshToken from responseInterceptor", refreshToken);

          if (refreshToken) {
            try {
              console.log("Access token expired. Attempting to refresh token...");
              const response = await api.post('/token/refresh/', { refresh: refreshToken });

              const { access, refresh } = response.data;

              sessionStorage.setItem('access', access);
              // ถ้ามี refresh token ตัวใหม่ส่งมาด้วย ให้ทำการอัปเดต
              if (refresh) {
                sessionStorage.setItem('refresh', refresh);
              }
              
              api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
              originalRequest.headers['Authorization'] = `Bearer ${access}`;

              // ส่ง request เดิมซ้ำอีกครั้งด้วย token ใหม่
              return api(originalRequest);
            } catch (refreshError) {
              console.error("Refresh token is invalid. Logging out.", refreshError);
              logout();
            }
          } else {
             console.log("No refresh token available. Logging out.");
             logout();
          }

        }
        
        return Promise.reject(error);
      }
    );

    // cleanup interceptor
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // ตรวจสอบ Token ทุกครั้งที่โหลดหน้าเว็บ
  useEffect(() => {
    const checkUser = async () => {
      const token = sessionStorage.getItem('access');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await fetchUser();
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, logout, triggerGoogleLogin: googleLoginFlow, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};