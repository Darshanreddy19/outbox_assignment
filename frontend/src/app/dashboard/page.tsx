"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import EmailTable from "@/components/EmailTable";
import ComposeModal from "@/components/ComposeModal";
import { User, ScheduledEmail, SentEmail, EmailStats } from "@/types";
import {
  getMe,
  getScheduledEmails,
  getSentEmails,
  getEmailStats,
  scheduleBatchEmails,
  cancelEmail,
} from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    scheduled: 0,
    sent: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("google_token", token);
      window.history.replaceState({}, "", "/dashboard");
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const token = localStorage.getItem("google_token");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([fetchUser(), fetchEmails(), fetchStats()]).finally(() =>
      setLoading(false)
    );
  }, [authReady, router]);

  useEffect(() => {
    if (user) fetchEmails();
  }, [activeTab, user]);

  const fetchUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      localStorage.removeItem("google_token");
      router.push("/login");
    }
  };

  const fetchEmails = async () => {
    try {
      if (activeTab === "scheduled") {
        const data = await getScheduledEmails();
        setScheduledEmails(data);
      } else {
        const data = await getSentEmails();
        setSentEmails(data);
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getEmailStats();
      setStats(data);
    } catch {}
  };

  const handleSchedule = async (data: any) => {
    await scheduleBatchEmails(data);
    await Promise.all([fetchEmails(), fetchStats()]);
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelEmail(id);
      setScheduledEmails((prev) => prev.filter((e) => e.id !== id));
      showToast("Email cancelled");
      fetchStats();
    } catch (err: any) {
      showToast(err.message || "Failed to cancel");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_token");
    router.push("/login");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f08a5d]/30 border-t-[#f08a5d] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Header user={user} onLogout={handleLogout} />

      {toast && (
        <div className="fixed top-20 right-4 bg-[#f08a5d] text-[#101316] px-4 py-2 rounded-lg text-sm z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-5 sm:px-6 py-8 sm:py-10">
        <div className="mb-9 animate-rise-in">
          <p className="text-xs uppercase tracking-[0.2em] text-[#f08a5d] mb-3">
            Workspace overview
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f1e8]">
            Keep your send queue in rhythm.
          </h2>
          <p className="text-[#9ba4a8] mt-2">
            A clear view of what&apos;s moving, what&apos;s next, and what needs
            attention.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Scheduled", value: stats.scheduled, color: "text-[#f08a5d]" },
            { label: "Sent", value: stats.sent, color: "text-[#63c29a]" },
            { label: "Failed", value: stats.failed, color: "text-[#ef7474]" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#171b1f] border border-[#30383e] rounded-xl p-5 hover:border-[#47525a] transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#9ba4a8]">{s.label}</p>
                <span
                  className={`w-2 h-2 rounded-full ${
                    s.label === "Scheduled"
                      ? "bg-[#f08a5d]"
                      : s.label === "Sent"
                      ? "bg-[#63c29a]"
                      : "bg-[#ef7474]"
                  }`}
                />
              </div>
              <p
                className={`text-3xl font-semibold mt-3 ${s.color}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-[#171b1f] border border-[#30383e] rounded-lg p-1">
            {(["scheduled", "sent"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#f08a5d] text-[#101316]"
                    : "text-[#9ba4a8] hover:text-[#f5f1e8]"
                }`}
              >
                {tab === "scheduled" ? "Scheduled" : "Sent"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setComposeOpen(true)}
            className="px-5 py-2.5 bg-[#f08a5d] hover:bg-[#ff9c70] rounded-lg text-[#101316] font-semibold transition-colors text-sm"
          >
            + Compose New Email
          </button>
        </div>

        <div className="bg-[#171b1f] border border-[#30383e] rounded-xl overflow-hidden shadow-xl shadow-black/10">
          {activeTab === "scheduled" ? (
            <EmailTable
              type="scheduled"
              emails={scheduledEmails}
              loading={false}
              onCancel={handleCancel}
            />
          ) : (
            <EmailTable type="sent" emails={sentEmails} loading={false} />
          )}
        </div>
      </main>

      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSchedule={handleSchedule}
      />
    </div>
  );
}
