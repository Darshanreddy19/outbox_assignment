import { Queue } from "bullmq";
import { bullRedis, isRedisAvailable } from "../redis";
import { prisma } from "../db";

const EMAIL_QUEUE = "email-scheduler";

export let emailQueue: Queue | null = null;

export function initializeQueue() {
  if (!emailQueue && isRedisAvailable() && bullRedis) {
    emailQueue = new Queue(EMAIL_QUEUE, {
    connection: bullRedis,
    defaultJobOptions: {
      removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
      removeOnFail: { age: 7 * 24 * 3600, count: 500 },
    },
    });
  }
  return emailQueue;
}

export interface ScheduleEmailParams {
  userId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
  scheduledTime: Date;
}

export async function scheduleEmail(params: ScheduleEmailParams) {
  initializeQueue();
  const dbEmail = await prisma.scheduledEmail.create({
    data: {
      userId: params.userId,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      body: params.body,
      senderEmail: params.senderEmail,
      scheduledTime: params.scheduledTime,
      status: "scheduled",
    },
  });

  if (!emailQueue || !isRedisAvailable()) {
    // Demo mode: just save to DB without queuing
    return { ...dbEmail, bullJobId: null, demoMode: true };
  }

  const delayMs = new Date(params.scheduledTime).getTime() - Date.now();

  const job = await emailQueue.add(
    "send-email",
    {
      emailId: dbEmail.id,
      recipientEmail: params.recipientEmail,
      subject: params.subject,
      body: params.body,
      senderEmail: params.senderEmail,
    },
    {
      delay: Math.max(delayMs, 0),
      jobId: dbEmail.id,
    }
  );

  await prisma.scheduledEmail.update({
    where: { id: dbEmail.id },
    data: { bullJobId: job.id },
  });

  return { ...dbEmail, bullJobId: job.id };
}

export async function scheduleBatchEmails(params: {
  userId: string;
  recipients: string[];
  subject: string;
  body: string;
  senderEmail: string;
  startTime: Date;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
}) {
  const results: Array<{
    recipientEmail: string;
    scheduledTime: Date;
    job: any;
  }> = [];
  const startMs = params.startTime.getTime();
  let emailsScheduledThisWindow = 0;
  let windowOffset = 0;

  for (let i = 0; i < params.recipients.length; i++) {
    const baseTime = startMs + i * params.delayBetweenEmailsMs;

    if (emailsScheduledThisWindow >= params.hourlyLimit) {
      windowOffset += 3600 * 1000;
      emailsScheduledThisWindow = 0;
    }

    const scheduledTime = new Date(baseTime + windowOffset);
    const job = await scheduleEmail({
      userId: params.userId,
      recipientEmail: params.recipients[i],
      subject: params.subject,
      body: params.body,
      senderEmail: params.senderEmail,
      scheduledTime,
    });

    results.push({
      recipientEmail: params.recipients[i],
      scheduledTime,
      job,
    });

    emailsScheduledThisWindow++;
  }

  return results;
}
