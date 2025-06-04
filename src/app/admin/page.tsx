"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in and is cameronbyrne@ucsb.edu
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.email !== "cameronbyrne@ucsb.edu") {
        router.replace("/login");
      }
    });
  }, [router]);

  // Load emails from a CSV or database
  useEffect(() => {
    // Example: Load from a CSV or API
    setEmails(["cameronbyrne@ucsb.edu", "user2@example.com"]);
  }, []);

  // Authorize a user using the Edge Function
  const authorizeUser = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email }
      });
      
      if (error) throw error;
      alert(`Invite sent to ${email}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr key={email}>
              <td className="border p-2">{email}</td>
              <td className="border p-2">
                <button
                  onClick={() => authorizeUser(email)}
                  disabled={loading}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition"
                >
                  {loading ? "Authorizing..." : "Authorize"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 