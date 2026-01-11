import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = new Redis(redisUrl);

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

redisClient.on("connect", () => {
    console.log("Connected to Redis");
});

export const CacheKeys = {
    user: (id: number | string) => `user:${id}`,
    userByEmail: (email: string) => `user:email:${email}`,
    token: (token: string) => `token:${token}`,
    tech: (id: number | string) => `tech:${id}`,
    framework: (id: number | string) => `framework:${id}`,
};

export const redis = {
    client: redisClient,

    async getJson<T>(key: string): Promise<T | null> {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    },

    async setJson(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
    },

    async del(key: string): Promise<void> {
        await redisClient.del(key);
    },

    async ttl(key: string): Promise<number> {
        return await redisClient.ttl(key);
    }
};

export default redis;
