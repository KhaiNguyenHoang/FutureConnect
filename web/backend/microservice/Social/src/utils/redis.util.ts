import Redis from "ioredis";

const redisUrl = Bun.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl);

export const CacheKeys = {
    FEED: (userId: string) => `feed:${userId}`,
    POST: (postId: string) => `post:${postId}`,
    TRENDING_TAGS: "trending:tags",
    TRENDING_POSTS: "trending:posts",
    TRENDING_QUESTIONS: "trending:questions",
};

export const cacheGet = async (key: string) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

export const cacheSet = async (key: string, value: any, ttlSeconds: number = 3600) => {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

export const incrementScore = async (key: string, member: string, increment: number = 1) => {
    await redis.zincrby(key, increment, member);
};

export const getTopMembers = async (key: string, limit: number = 10) => {
    return await redis.zrevrange(key, 0, limit - 1, "WITHSCORES");
};
