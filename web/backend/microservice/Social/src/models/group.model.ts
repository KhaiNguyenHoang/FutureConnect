import mongoose, { Schema, Document } from "mongoose";

export interface IGroup extends Document {
    name: string;
    description?: string;
    creatorId: string;
    members: string[]; // User IDs
    privacy: "Public" | "Private";
    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
        creatorId: { type: String, required: true },
        members: [{ type: String }],
        privacy: { type: String, enum: ["Public", "Private"], default: "Public" },
    },
    { timestamps: true }
);

export const Group = mongoose.model<IGroup>("Group", GroupSchema);
