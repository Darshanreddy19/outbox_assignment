export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export interface ScheduledEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  scheduledTime: string;
  status: "scheduled" | "rate_limited" | "processing" | "sent" | "failed";
  createdAt: string;
}

export interface SentEmail {
  id: string;
  recipientEmail: string;
  subject: string;
  senderEmail: string;
  scheduledTime: string;
  status: "sent" | "failed";
  sentAt: string | null;
  errorMessage: string | null;
}

export interface EmailStats {
  scheduled: number;
  sent: number;
  failed: number;
}
