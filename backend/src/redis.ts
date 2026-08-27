import Redis from "ioredis";
import { config } from "./config";

let bullRedis: Redis | null = null;
let rateLimitRedis: Redis | null = null;
let redisAvailable = false;

function createConnection(name: string) {
  return new Redis({
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectionName: name,
    lazyConnect: true,
    connectTimeout: 3000,
    retryStrategy(times) {
      if (times > 1) return null;
      return 500;
    },
  });
}

export async function connectRedis() {
  try {
    bullRedis = createConnection("bullmq");
    rateLimitRedis = createConnection("rate-limit");
    await Promise.all([bullRedis.connect(), rateLimitRedis.connect()]);
    redisAvailable = true;
    console.log("Redis connected");
  } catch (error: any) {
    redisAvailable = false;
    console.error("Redis connection failed:", error.message);
    throw error;
  }
}

export { bullRedis, rateLimitRedis };

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export async function checkRedisHealth(): Promise<boolean> {
  if (!bullRedis || !redisAvailable) return false;
  try {
    const pong = await bullRedis.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
