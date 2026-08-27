import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  scheduleEmail,
  scheduleBatchEmails,
  emailQueue,
} from "../services/scheduler";
import { prisma } from "../db";

const router = Router();

router.use(authMiddleware);

router.post("/schedule", async (req: AuthRequest, res) => {
  try {
    const { recipientEmail, subject, body, senderEmail, scheduledTime } =
      req.body;

    if (!recipientEmail || !subject || !body || !senderEmail || !scheduledTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const job = await scheduleEmail({
      userId: req.userId!,
      recipientEmail,
      subject,
      body,
      senderEmail,
      scheduledTime: new Date(scheduledTime),
    });

    res.status(201).json(job);
  } catch (err: any) {
    console.error("Schedule error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/schedule-batch", async (req: AuthRequest, res) => {
  try {
    const {
      recipients,
      subject,
      body,
      senderEmail,
      startTime,
      delayBetweenEmailsMs,
      hourlyLimit,
    } = req.body;

    if (!recipients?.length || !subject || !body || !senderEmail || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const results = await scheduleBatchEmails({
      userId: req.userId!,
      recipients,
      subject,
      body,
      senderEmail,
      startTime: new Date(startTime),
      delayBetweenEmailsMs: delayBetweenEmailsMs || 2000,
      hourlyLimit: hourlyLimit || 200,
    });

    res.status(201).json({
      scheduled: results.length,
      emails: results,
    });
  } catch (err: any) {
    console.error("Batch schedule error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/scheduled", async (req: AuthRequest, res) => {
  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: {
        userId: req.userId,
        status: { in: ["scheduled", "rate_limited"] },
      },
      orderBy: { scheduledTime: "asc" },
      select: {
        id: true,
        recipientEmail: true,
        subject: true,
        body: true,
        senderEmail: true,
        scheduledTime: true,
        status: true,
        createdAt: true,
      },
    });
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/sent", async (req: AuthRequest, res) => {
  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: {
        userId: req.userId,
        status: { in: ["sent", "failed"] },
      },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        recipientEmail: true,
        subject: true,
        senderEmail: true,
        scheduledTime: true,
        status: true,
        sentAt: true,
        errorMessage: true,
      },
    });
    res.json(emails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const emailIdParam = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const email = await prisma.scheduledEmail.findFirst({
      where: { id: emailIdParam, userId: req.userId! },
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    if (email.status !== "scheduled" && email.status !== "rate_limited") {
      return res.status(400).json({ error: "Can only cancel scheduled emails" });
    }

    if (email.bullJobId && emailQueue) {
      const job = await emailQueue.getJob(email.bullJobId);
      if (job) await job.remove();
    }

    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: { status: "failed", errorMessage: "Cancelled by user" },
    });

    res.json({ message: "Email cancelled" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const [scheduled, sent, failed] = await Promise.all([
      prisma.scheduledEmail.count({
        where: {
          userId: req.userId,
          status: { in: ["scheduled", "rate_limited", "processing"] },
        },
      }),
      prisma.scheduledEmail.count({
        where: { userId: req.userId, status: "sent" },
      }),
      prisma.scheduledEmail.count({
        where: { userId: req.userId, status: "failed" },
      }),
    ]);
    res.json({ scheduled, sent, failed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
