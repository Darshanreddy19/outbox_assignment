"use client";

import { ScheduledEmail, SentEmail } from "@/types";

interface EmailTableProps {
  type: "scheduled" | "sent";
  emails: ScheduledEmail[] | SentEmail[];
  loading: boolean;
  onCancel?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-400",
  processing: "bg-yellow-500/20 text-yellow-400",
  rate_limited: "bg-orange-500/20 text-orange-400",
  sent: "bg-green-500/20 text-green-400",
  failed: "bg-red-500/20 text-red-400",
};

export default function EmailTable({ type, emails, loading, onCancel }: EmailTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-[#222] rounded-lg animate-pulse-soft" />
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-[#f08a5d]/10 text-[#f08a5d] flex items-center justify-center text-xl">{type === "scheduled" ? "S" : "A"}</div>
        <p className="text-[#9ba4a8] text-lg">
          No {type} emails yet
        </p>
          <p className="text-[#657075] text-sm mt-1">
          {type === "scheduled"
            ? "Schedule some emails to get started"
            : "Sent emails will appear here"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[#171b1f]">
          <tr className="border-b border-[#30383e]">
            <th className="py-4 px-5 text-[11px] uppercase tracking-[0.12em] text-[#657075] font-semibold">Email</th>
            <th className="py-4 px-5 text-[11px] uppercase tracking-[0.12em] text-[#657075] font-semibold">Subject</th>
            <th className="py-4 px-5 text-[11px] uppercase tracking-[0.12em] text-[#657075] font-semibold">
              {type === "scheduled" ? "Scheduled Time" : "Sent Time"}
            </th>
            <th className="py-4 px-5 text-[11px] uppercase tracking-[0.12em] text-[#657075] font-semibold">Status</th>
            {type === "scheduled" && (
              <th className="py-4 px-5 text-[11px] uppercase tracking-[0.12em] text-[#657075] font-semibold">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {emails.map((email) => (
            <tr
              key={email.id}
              className="border-b border-[#252c31] hover:bg-[#20272c] transition-colors"
            >
              <td className="py-4 px-5 text-sm text-[#d9d5cc]">{email.recipientEmail}</td>
              <td className="py-4 px-5 text-sm max-w-[240px] truncate text-[#f5f1e8]">{email.subject}</td>
              <td className="py-4 px-5 text-sm text-[#9ba4a8]">
                {type === "scheduled"
                  ? new Date((email as ScheduledEmail).scheduledTime).toLocaleString()
                  : (email as SentEmail).sentAt
                  ? new Date((email as SentEmail).sentAt!).toLocaleString()
                  : "-"}
              </td>
              <td className="py-4 px-5">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                    statusColors[email.status] || "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  {email.status}
                </span>
              </td>
              {type === "scheduled" && (
                <td className="py-3 px-4">
                  <button
                    onClick={() => onCancel?.(email.id)}
                    className="text-xs text-[#ef7474] hover:text-[#ff9999] transition-colors"
                  >
                    Cancel
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
