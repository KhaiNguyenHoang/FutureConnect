import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
    name: string;
    usageCount: number;
}

const TagSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        usageCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Tag = mongoose.model<ITag>("Tag", TagSchema);
