"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';

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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 text-lg text-slate-600"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-xl shadow-xl shadow-blue-400/80 ring-2 ring-blue-300 ring-offset-2 ring-offset-white border border-gray-200/50 p-8 backdrop-blur-sm"

      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">Fraternal Alumni Network</h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-6">
          <div className="space-y-2">
            
            <div className="relative">
              <input
                id="passcode"
                type={showPasscode ? "text" : "password"}
                placeholder="Enter your code"
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-center text-lg tracking-wider pr-12 bg-white/80 backdrop-blur-sm"
                autoComplete="off"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
                tabIndex={-1}
                disabled={loading}
              >
                {showPasscode ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !passcode.trim()}
            className="w-full bg-primary text-white rounded-lg px-4 py-3 font-semibold hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Access"
            )}
          </button>
        </form>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="text-red-600 text-sm text-center font-medium">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Fraternal Alumni Network
          </p>
        </div>
      </motion.div>
    </div>
  );
} 