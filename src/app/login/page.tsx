"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        router.replace("/"); // Redirect to home if logged in
      }
    });
  }, [router]);

  // Handle email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data.user) {
      router.replace("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 flex flex-col items-center">
        {/* App Name/Logo */}
        <h1 className="text-3xl font-bold mb-2 text-primary">Fraternal Alumni Network</h1>
        <p className="mb-6 text-slate-500 text-center">Sign in to your account</p>
        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border rounded px-4 py-2 w-full focus:outline-primary"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border rounded px-4 py-2 w-full focus:outline-primary"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white rounded px-4 py-2 font-semibold hover:bg-primary/90 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
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