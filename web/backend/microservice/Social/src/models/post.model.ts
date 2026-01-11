import mongoose, { Schema, Document } from "mongoose";

export interface IPost extends Document {
    content: string;
    authorId: string;
    media?: string[];
    tags: string[];
    groupId?: string;
    stats: {
        likes: number;
        comments: number;
        shares: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PostSchema = new Schema(
    {
        content: { type: String, required: true },
        authorId: { type: String, required: true, index: true },
        media: [{ type: String }],
        tags: [{ type: String, index: true }],
        groupId: { type: Schema.Types.ObjectId, ref: "Group", index: true },
        stats: {
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

export const Post = mongoose.model<IPost>("Post", PostSchema);
