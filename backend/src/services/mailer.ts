import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { config } from "../config";

let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (!config.email.smtpUser || !config.email.smtpPassword) {
    throw new Error("SMTP credentials are missing from backend/.env");
  }

  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: false,
    auth: {
      user: config.email.smtpUser,
      pass: config.email.smtpPassword,
    },
  });

  return transporter;
}

export interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Email sent to ${params.to}: ${previewUrl}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (err: any) {
    console.error(`Email failed to ${params.to}:`, err.message);
    return { success: false, error: err.message };
  }
}
