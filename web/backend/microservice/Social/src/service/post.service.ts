import { InferContext } from "elysia";
import { App } from "../setup";
import { Post } from "../models/post.model";
import { Tag } from "../models/tag.model";
import { TrendingService } from "./trending.service"; // We will refactor this later, for now import as is or refactor it next
import { CacheKeys, cacheGet, cacheSet } from "../utils/redis.util";
import { publishEvent } from "../utils/rabbitmq.util";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

interface CreatePostBody {
    content: string;
    media?: string[];
    tags?: string[];
    groupId?: string;
    userId?: string; // Passed from header usually, but body for now based on route
}

export const createPostService = async (body: CreatePostBody, ctx: Context) => {
    try {
        // Headers are accessible via ctx.request.headers if needed, 
        // but current route implementation passes userId via body/header merge.
        // Let's assume controller/route handles extraction or we get it from body.
        // In Auth service, userId is likely in `ctx.user` if using JWT plugin derivation, 
        // but here we are doing microservice calls, maybe x-user-id header.

        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const { content, media, tags, groupId } = body;

        const post = new Post({
            authorId: userId,
            content,
            media,
            tags,
            groupId,
        });
        await post.save();

        // Handle tags
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                // Update Tag model
                await Tag.findOneAndUpdate(
                    { name: tagName },
                    { $inc: { usageCount: 1 } },
                    { upsert: true }
                );
                // Update Redis Trending
                // Assuming TrendingService is still object-based for this step, 
                // or we can just call the method if we refactor it too.
                await TrendingService.trackTagUsage(tagName);
            }
        }

        // Publish event
        await publishEvent("post.created", { postId: post._id, userId, tags });

        ctx.set.status = 201;
        return post.toObject();

    } catch (error) {
        console.error("Create Post Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const getPostService = async (params: { id: string }, ctx: Context) => {
    try {
        const postId = params.id;
        const cached = await cacheGet(CacheKeys.POST(postId));
        if (cached) return cached;

        const post = await Post.findById(postId).lean();
        if (post) {
            await cacheSet(CacheKeys.POST(postId), post, 300);
            await TrendingService.trackPostActivity(postId, 1);
        }

        if (!post) {
            ctx.set.status = 404;
            return { message: "Post not found" };
        }

        return post;
    } catch (error) {
        console.error("Get Post Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const getFeedService = async (query: { userId?: string }, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || query.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const page = 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        if (page === 1) {
            const cachedFeed = await cacheGet(CacheKeys.FEED(userId));
            if (cachedFeed) return cachedFeed;
        }

        const posts = await Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

        if (page === 1) {
            await cacheSet(CacheKeys.FEED(userId), posts, 60);
        }

        return posts;
    } catch (error) {
        console.error("Get Feed Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}
