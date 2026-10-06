import { createClient } from "redis";

type Redis = ReturnType<typeof createClient>;

let client: Redis | null = null;
let connecting: Promise<Redis | null> | null = null;

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (client?.isOpen) return client;
  if (!connecting) {
    connecting = (async () => {
      try {
        const next = createClient({ url: process.env.REDIS_URL });
        next.on("error", (error) => console.error("Redis error:", error));
        await next.connect();
        client = next;
        return next;
      } catch (error) {
        console.error("Redis connection failed:", error);
        return null;
      } finally {
        connecting = null;
      }
    })();
  }
  return connecting;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 30) {
  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {}
}

export async function cachePing() {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
}
