import mongoose, { Schema, Document } from "mongoose";

export interface IVote extends Document {
    userId: string;
    targetId: string;
    targetType: "Question" | "Answer";
    value: number; // 1 or -1
    createdAt: Date;
}

const VoteSchema = new Schema(
    {
        userId: { type: String, required: true },
        targetId: { type: Schema.Types.ObjectId, required: true, index: true },
        targetType: {
            type: String,
            enum: ["Question", "Answer"],
            required: true
        },
        value: { type: Number, required: true, enum: [1, -1] },
    },
    { timestamps: true }
);

VoteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Vote = mongoose.model<IVote>("Vote", VoteSchema);
