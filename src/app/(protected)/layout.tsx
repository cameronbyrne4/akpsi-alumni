"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = Cookies.get('isAuthenticated') === 'true';
    
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [router]);

  return <>{children}</>;
} 