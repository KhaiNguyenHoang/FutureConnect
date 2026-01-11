import { CacheKeys, incrementScore, getTopMembers } from "../utils/redis.util";

export const TrendingService = {
    // Increment score for a tag
    trackTagUsage: async (tagName: string) => {
        await incrementScore(CacheKeys.TRENDING_TAGS, tagName, 1);
    },

    // Increment score for a post (e.g. on view/like)
    trackPostActivity: async (postId: string, score: number = 1) => {
        await incrementScore(CacheKeys.TRENDING_POSTS, postId, score);
    },

    // Increment score for a question
    trackQuestionActivity: async (questionId: string, score: number = 1) => {
        await incrementScore(CacheKeys.TRENDING_QUESTIONS, questionId, score);
    },

    // Get trending tags
    getTrendingTags: async (limit: number = 10) => {
        return await getTopMembers(CacheKeys.TRENDING_TAGS, limit);
    },

    // Get trending posts IDs
    getTrendingPosts: async (limit: number = 10) => {
        return await getTopMembers(CacheKeys.TRENDING_POSTS, limit);
    },

    // Get trending questions IDs
    getTrendingQuestions: async (limit: number = 10) => {
        return await getTopMembers(CacheKeys.TRENDING_QUESTIONS, limit);
    },
};
