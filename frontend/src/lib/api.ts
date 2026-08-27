const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("google_token")
      : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const getGoogleAuthUrl = () =>
  fetchAPI<{ url: string }>("/api/auth/google");
export const getMe = () => fetchAPI<any>("/api/auth/me");

export const scheduleEmail = (data: {
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  scheduledTime: string;
}) =>
  fetchAPI<any>("/api/emails/schedule", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const scheduleBatchEmails = (data: {
  recipients: string[];
  subject: string;
  body: string;
  senderEmail: string;
  startTime: string;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}) =>
  fetchAPI<any>("/api/emails/schedule-batch", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getScheduledEmails = () => fetchAPI<any[]>("/api/emails/scheduled");
export const getSentEmails = () => fetchAPI<any[]>("/api/emails/sent");
export const getEmailStats = () => fetchAPI<any>("/api/emails/stats");
export const cancelEmail = (id: string) =>
  fetchAPI<any>(`/api/emails/${id}`, { method: "DELETE" });
