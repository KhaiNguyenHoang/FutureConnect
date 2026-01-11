import mongoose, { Schema, Document } from "mongoose";

export interface IFollow extends Document {
    followerId: string;
    followingId: string;
    createdAt: Date;
}

const FollowSchema = new Schema(
    {
        followerId: { type: String, required: true, index: true },
        followingId: { type: String, required: true, index: true },
    },
    { timestamps: true }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow>("Follow", FollowSchema);
