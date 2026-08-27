"use client";

import { useState, useRef } from "react";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: any) => Promise<void>;
}

export default function ComposeModal({
  isOpen,
  onClose,
  onSchedule,
}: ComposeModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [startTime, setStartTime] = useState("");
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emails = text
        .split(/[\n,;]+/)
        .map((cell) => cell.trim())
        .filter((cell) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell));
      setRecipients([...new Set(emails)]);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipients.length || !subject || !body || !senderEmail || !startTime) {
      setToast("Please fill all fields and upload a CSV with recipients");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setLoading(true);
    try {
      await onSchedule({
        recipients,
        subject,
        body,
        senderEmail,
        startTime: new Date(startTime).toISOString(),
        delayBetweenEmailsMs: delayBetweenEmails * 1000,
        hourlyLimit,
      });
      setToast(`Scheduled ${recipients.length} emails!`);
      setTimeout(() => {
        setToast("");
        onClose();
        setSubject("");
        setBody("");
        setSenderEmail("");
        setStartTime("");
        setRecipients([]);
        setCsvFileName("");
      }, 1500);
    } catch (err: any) {
      setToast(err.message || "Failed to schedule emails");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#080a0b]/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#171b1f] rounded-2xl border border-[#30383e] shadow-2xl shadow-black/40 animate-rise-in max-h-[90vh] overflow-y-auto">
        {toast && (
          <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm z-50 animate-fade-in">
            {toast}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#f08a5d] mb-1">
                New delivery
              </p>
              <h2 className="text-xl font-semibold text-[#f5f1e8]">
                Compose email
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#657075] hover:text-[#f5f1e8] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1">
                Sender Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="sender@example.com"
                className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] placeholder-[#657075] focus:border-[#f08a5d] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] placeholder-[#657075] focus:border-[#f08a5d] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email body here..."
                rows={4}
                className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] placeholder-[#657075] focus:border-[#f08a5d] focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1">
                Recipients CSV{" "}
                {recipients.length > 0 &&
                  `(${recipients.length} emails found)`}
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                ref={fileRef}
                onChange={handleCsvUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full px-4 py-2.5 bg-[#101316] border border-dashed border-[#30383e] rounded-lg text-[#9ba4a8] hover:border-[#f08a5d] hover:text-[#f5f1e8] transition-colors"
              >
                {csvFileName || "Upload CSV with email addresses"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a0a0a0] mb-1">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] focus:border-[#f08a5d] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#a0a0a0] mb-1">
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  value={delayBetweenEmails}
                  onChange={(e) =>
                    setDelayBetweenEmails(Number(e.target.value))
                  }
                  min={1}
                  className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] focus:border-[#f08a5d] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#a0a0a0] mb-1">
                Hourly Limit
              </label>
              <input
                type="number"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-2.5 bg-[#101316] border border-[#30383e] rounded-lg text-[#f5f1e8] focus:border-[#f08a5d] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !recipients.length}
              className="w-full py-3 bg-[#f08a5d] hover:bg-[#ff9c70] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[#101316] font-semibold transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Scheduling...
                </span>
              ) : (
                `Schedule ${recipients.length || ""} Emails`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
