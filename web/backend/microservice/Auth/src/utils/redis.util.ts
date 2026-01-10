import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redis = new Redis(redisUrl);

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

export default redis;
