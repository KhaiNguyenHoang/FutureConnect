import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
    userId: string;
    targetId: string;
    targetType: "Post" | "Comment" | "Question" | "Answer";
    createdAt: Date;
}

const LikeSchema = new Schema(
    {
        userId: { type: String, required: true },
        targetId: { type: Schema.Types.ObjectId, required: true, index: true },
        targetType: {
            type: String,
            enum: ["Post", "Comment", "Question", "Answer"],
            required: true
        },
    },
    { timestamps: true }
);

LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Like = mongoose.model<ILike>("Like", LikeSchema);
