import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3001"),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:3001/api/auth/google/callback",
  },

  rateLimit: {
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || "200"),
  },

  email: {
    sendDelayMs: parseInt(process.env.EMAIL_SEND_DELAY_MS || "2000"),
    workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || "5"),
    smtpHost: process.env.SMTP_HOST || "smtp.ethereal.email",
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    smtpUser: process.env.SMTP_USER || "",
    smtpPassword: process.env.SMTP_PASSWORD || "",
  },
};
