
import { InferContext } from "elysia";
import { App } from "../setup";
import { Comment } from "../models/comment.model";
import { Post } from "../models/post.model";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

export const addCommentService = async (body: { content: string, postId: string, parentId?: string, media?: string[] }, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || (ctx.body as any)?.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const { content, postId, parentId, media } = body;

        // Verify post exists
        const post = await Post.findById(postId);
        if (!post) {
            ctx.set.status = 404;
            return { message: "Post not found" };
        }

        // If reply, verify parent exists
        if (parentId) {
            const parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                ctx.set.status = 404;
                return { message: "Parent comment not found" };
            }
            if (parentComment.postId.toString() !== postId) {
                ctx.set.status = 400;
                return { message: "Parent comment does not belong to this post" };
            }
        }

        const comment = new Comment({
            authorId: userId,
            postId,
            parentId: parentId || null,
            content,
            media: media || []
        });
        await comment.save();

        if (parentId) {
            await Comment.findByIdAndUpdate(parentId, { $inc: { "stats.replyCount": 1 } });
        }

        // Use $inc for atomic update of post total comments if we had that field, 
        // effectively we might want to track total comments on post too later.

        return comment.toObject();
    } catch (error) {
        console.error("Add Comment Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
};

export const getCommentsService = async (params: { postId: string }, query: { page?: string, limit?: string }, ctx: Context) => {
    try {
        const { postId } = params;
        const page = parseInt(query.page || "1");
        const limit = parseInt(query.limit || "20");
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ postId, parentId: null })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Comment.countDocuments({ postId, parentId: null });

        return {
            data: comments,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Get Comments Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
};

export const getRepliesService = async (params: { commentId: string }, query: { page?: string, limit?: string }, ctx: Context) => {
    try {
        const { commentId } = params;
        const page = parseInt(query.page || "1");
        const limit = parseInt(query.limit || "20");
        const skip = (page - 1) * limit;

        const replies = await Comment.find({ parentId: commentId })
            .sort({ createdAt: 1 }) // Chronological for replies usually
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Comment.countDocuments({ parentId: commentId });

        return {
            data: replies,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Get Replies Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
};
