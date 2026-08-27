"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Google sign-in is unavailable right now.");
      }
      const { url } = data;
      window.location.href = url;
    } catch (err) {
      console.error("Failed to get Google auth URL:", err);
      setError(err instanceof Error ? err.message : "Unable to start Google sign-in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[34rem] h-[34rem] rounded-full bg-[#f08a5d]/10 blur-3xl" />
      <div className="w-full max-w-md p-8 sm:p-10 bg-[#171b1f] rounded-2xl border border-[#30383e] shadow-2xl shadow-black/25 animate-rise-in relative">
        <div className="mb-10">
          <div className="text-sm uppercase tracking-[0.2em] text-[#f08a5d] mb-7">Outbox</div>
          <h1 className="text-3xl font-semibold mb-3 text-[#f5f1e8]">Your delivery desk.</h1>
          <p className="text-[#9ba4a8] leading-6">Sign in to plan, pace, and follow every email from one place.</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#f5f1e8] text-[#101316] rounded-lg font-semibold hover:bg-white transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <div role="alert" className="mt-4 rounded-lg border border-[#ef7474]/40 bg-[#ef7474]/10 px-4 py-3 text-sm text-[#ff9999]">
            {error}
          </div>
        )}

        <p className="text-center text-[#657075] text-xs mt-7">
          Secure sign-in
        </p>
      </div>
    </div>
  );
}
