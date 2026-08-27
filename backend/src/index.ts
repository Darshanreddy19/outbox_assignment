import express from "express";
import cors from "cors";
import { config } from "./config";
import { connectDB } from "./db";
import { createWorker } from "./worker";
import { checkRedisHealth, connectRedis } from "./redis";
import { initializeQueue } from "./services/scheduler";
import authRoutes from "./routes/auth";
import emailRoutes from "./routes/email";

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);

app.get("/api/health", async (_req, res) => {
  const redisOk = await checkRedisHealth();
  res.json({
    status: "ok",
    redis: redisOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

async function start() {
  await connectDB();
  await connectRedis();
  initializeQueue();
  createWorker();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start().catch(console.error);
