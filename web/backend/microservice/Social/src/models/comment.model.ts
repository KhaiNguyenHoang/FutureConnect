import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
    content: string;
    authorId: string;
    postId: string;
    parentId?: string | null;
    media?: string[];
    stats: {
        likes: number;
        replyCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema(
    {
        content: { type: String, required: true },
        authorId: { type: String, required: true },
        postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
        parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null, index: true },
        media: [{ type: String }],
        stats: {
            likes: { type: Number, default: 0 },
            replyCount: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model<IComment>("Comment", CommentSchema);
