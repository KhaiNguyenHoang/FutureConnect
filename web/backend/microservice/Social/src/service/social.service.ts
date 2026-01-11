import { InferContext } from "elysia";
import { App } from "../setup";
import { Follow } from "../models/follow.model";
import { Like } from "../models/like.model";
import { Post } from "../models/post.model";
import { Comment } from "../models/comment.model";
import { TrendingService } from "./trending.service";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

export const followUserService = async (params: { id: string }, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || (ctx.body as any)?.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const followingId = params.id;
        if (userId === followingId) {
            ctx.set.status = 400;
            return { message: "Cannot follow yourself" };
        }

        const follow = new Follow({ followerId: userId, followingId });
        await follow.save();
        return follow.toObject();
    } catch (error) {
        console.error("Follow User Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const unfollowUserService = async (params: { id: string }, ctx: Context) => {
    // Implementation similar to above if needed, but skipped in original route for now
    return { message: "Not implemented in route yet" };
}

export const likeTargetService = async (params: { id: string }, body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const targetId = params.id;
        const targetType = body.type || "Post";

        // Check if already liked (Use lean)
        const existingLike = await Like.findOne({ userId, targetId, targetType }).lean();
        if (existingLike) return existingLike;

        const like = new Like({ userId, targetId, targetType });
        await like.save();

        // Increment stats
        if (targetType === "Post") {
            await Post.findByIdAndUpdate(targetId, { $inc: { "stats.likes": 1 } });
            await TrendingService.trackPostActivity(targetId, 5);
        } else if (targetType === "Comment") {
            await Comment.findByIdAndUpdate(targetId, { $inc: { "stats.likes": 1 } });
        }

        return like.toObject();
    } catch (error) {
        console.error("Like Target Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const getTrendingTagsService = async (ctx: Context) => {
    try {
        return await TrendingService.getTrendingTags();
    } catch (error) {
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}
