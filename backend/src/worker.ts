import { Worker, Job, Queue } from "bullmq";
import { bullRedis, rateLimitRedis, isRedisAvailable } from "./redis";
import { prisma } from "./db";
import { sendEmail } from "./services/mailer";
import { config } from "./config";

let emailQueue: Queue | null = null;

async function canSendEmail(senderEmail: string): Promise<boolean> {
  if (!rateLimitRedis || !isRedisAvailable()) return true;
  const hourWindow = Math.floor(Date.now() / (3600 * 1000));
  const key = `rate:${senderEmail}:${hourWindow}`;

  const current = await rateLimitRedis.incr(key);
  if (current === 1) {
    await rateLimitRedis.expire(key, 7200);
  }

  return current <= config.rateLimit.maxEmailsPerHour;
}

export function createWorker(): Worker | null {
  if (!bullRedis || !isRedisAvailable()) {
    console.log("Redis not available — worker skipped (demo mode)");
    return null;
  }

  emailQueue = new Queue("email-scheduler", { connection: bullRedis });
  const worker = new Worker<EmailJobData>(
    "email-scheduler",
    async (job: Job<EmailJobData>) => {
      const { emailId, recipientEmail, subject, body, senderEmail } = job.data;

      await prisma.scheduledEmail.update({
        where: { id: emailId },
        data: { status: "processing" },
      });

      const allowed = await canSendEmail(senderEmail);
      if (!allowed) {
        const nextHour = Math.ceil(Date.now() / (3600 * 1000)) * 3600 * 1000;
        const delayMs = nextHour - Date.now() + 1000;

        await prisma.scheduledEmail.update({
          where: { id: emailId },
          data: { status: "rate_limited" },
        });

        await emailQueue!.add("send-email", job.data, {
          delay: delayMs,
          jobId: job.data.emailId + "-rl",
        });
        return { status: "rescheduled", nextHour: new Date(nextHour) };
      }

      const result = await sendEmail({
        from: senderEmail,
        to: recipientEmail,
        subject,
        html: body,
      });

      if (result.success) {
        await prisma.scheduledEmail.update({
          where: { id: emailId },
          data: {
            status: "sent",
            sentAt: new Date(),
          },
        });
        return { status: "sent", messageId: result.messageId };
      } else {
        await prisma.scheduledEmail.update({
          where: { id: emailId },
          data: {
            status: "failed",
            errorMessage: result.error,
          },
        });
        throw new Error(result.error || "Email send failed");
      }
    },
    {
      connection: bullRedis!,
      concurrency: config.email.workerConcurrency,
      limiter: {
        max: config.rateLimit.maxEmailsPerHour,
        duration: 3600 * 1000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed for ${job.data.recipientEmail}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on("ready", () => {
    console.log("Worker ready, processing jobs...");
  });

  return worker;
}

export { emailQueue };

interface EmailJobData {
  emailId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderEmail: string;
}
