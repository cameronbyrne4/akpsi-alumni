"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = Cookies.get('isAuthenticated') === 'true';
    const userRole = Cookies.get('userRole');
    
    if (!isAuthenticated || userRole !== 'admin') {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
} 