import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
    title: string;
    body: string;
    authorId: string;
    tags: string[];
    views: number;
    votes: number;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSchema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        authorId: { type: String, required: true },
        tags: [{ type: String, index: true }],
        views: { type: Number, default: 0 },
        votes: { type: Number, default: 0 },
    },
    { timestamps: true }
);

QuestionSchema.index({ title: "text", body: "text" });

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
