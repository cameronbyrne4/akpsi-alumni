"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from 'lucide-react';
import Cookies from 'js-cookie';

// Get passcode from environment variable
const ACCESS_PASSCODE = process.env.NEXT_PUBLIC_ACCESS_PASSCODE;
const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE;

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showPasscode, setShowPasscode] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const isAuthenticated = Cookies.get('isAuthenticated') === 'true';
    console.log('Login page - Auth check:', { isAuthenticated, cookies: Cookies.get() });
    
    if (isAuthenticated) {
      router.replace('/');
    }
    setIsCheckingSession(false);
  }, [router]);

  // Handle passcode login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting login with passcode...');
      
      if (!ACCESS_PASSCODE) {
        console.error('Access code not configured in environment');
        setError('Access code not configured');
        return;
      }

      // Generate a unique user ID if it doesn't exist
      const userId = Cookies.get('userId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if it's an admin login
      const isAdmin = ADMIN_PASSCODE && passcode === ADMIN_PASSCODE;
      
      if (passcode === ACCESS_PASSCODE || isAdmin) {
        console.log('Passcode matched, setting authentication...');
        
        // Set authentication cookie
        Cookies.set('isAuthenticated', 'true', {
          expires: 7,
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });

        // Set user ID cookie
        Cookies.set('userId', userId, {
          expires: 7,
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });

        // Set user role cookie
        Cookies.set('userRole', isAdmin ? 'admin' : 'user', {
          expires: 7,
          path: '/',
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production'
        });
        
        console.log('Cookies set:', { 
          isAuthenticated: Cookies.get('isAuthenticated'),
          userId: Cookies.get('userId'),
          userRole: Cookies.get('userRole'),
          allCookies: Cookies.get()
        });
        
        router.replace('/');
        return;
      } else {
        console.log('Passcode mismatch');
        setError('Invalid passcode');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
        {/* App Name/Logo */}
        <h1 className="text-3xl font-bold mb-2 text-primary">Fraternal Alumni Network</h1>
        <p className="mb-6 text-slate-500 text-center">Enter passcode to access</p>
        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPasscode ? "text" : "password"}
              placeholder="Enter passcode"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              required
              className="border rounded px-4 py-2 w-full focus:outline-primary text-center text-lg tracking-wider pr-10"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              tabIndex={-1}
            >
              {showPasscode ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded px-4 py-2 font-semibold hover:bg-primary/90 transition"
          >
            {loading ? "Verifying..." : "Access"}
          </button>
        </form>
        {/* Error Message */}
        {error && <div className="mt-4 text-red-500 text-sm text-center">{error}</div>}
        {/* Footer */}
        <div className="mt-8 text-xs text-slate-400 text-center w-full">&copy; {new Date().getFullYear()} Fraternal Alumni Network</div>
      </div>
    </div>
  );
} 