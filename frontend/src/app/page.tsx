"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("google_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute -top-40 -left-32 w-96 h-96 rounded-full bg-[#f08a5d]/10 blur-3xl" />
      <div className="max-w-4xl w-full grid md:grid-cols-[1.15fr_0.85fr] gap-10 items-center animate-rise-in">
        <div>
          <div className="flex items-center gap-3 mb-8 text-sm uppercase tracking-[0.22em] text-[#f08a5d]">
            <span className="w-9 h-px bg-[#f08a5d]" />
            Outbox / delivery desk
          </div>
          <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight leading-[0.95] mb-6 text-[#f5f1e8]">
            Send with<br /><span className="text-[#f08a5d]">intention.</span>
          </h1>
          <p className="text-[#aeb7b9] text-lg leading-8 max-w-md mb-9">
            A calm, reliable workspace for planning campaigns, pacing delivery, and keeping every message accounted for.
          </p>
        <a
          href="/login"
            className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#f08a5d] hover:bg-[#ff9c70] text-[#101316] rounded-lg font-semibold transition-all hover:-translate-y-0.5"
        >
          Enter your outbox <span aria-hidden="true">-&gt;</span>
        </a>
        </div>
        <div className="border border-[#30383e] bg-[#171b1f]/80 rounded-2xl p-5 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between pb-5 border-b border-[#30383e]">
            <span className="text-sm text-[#aeb7b9]">Today&apos;s queue</span>
            <span className="w-2 h-2 rounded-full bg-[#63c29a] shadow-[0_0_12px_#63c29a]" />
          </div>
          <div className="py-7">
            <p className="text-5xl font-semibold text-[#f5f1e8]">24</p>
            <p className="text-[#8e999d] mt-2">messages scheduled</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#aeb7b9]"><span>Next delivery</span><span className="text-[#f5f1e8]">in 12 min</span></div>
            <div className="h-1.5 rounded-full bg-[#30383e] overflow-hidden"><div className="w-2/3 h-full bg-[#f08a5d] rounded-full" /></div>
            <div className="flex justify-between text-xs text-[#657075]"><span>Queue health</span><span className="text-[#63c29a]">All systems ready</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
