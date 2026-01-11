import mongoose, { Schema, Document } from "mongoose";

export interface IAnswer extends Document {
    body: string;
    authorId: string;
    questionId: string;
    isAccepted: boolean;
    votes: number;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerSchema = new Schema(
    {
        body: { type: String, required: true },
        authorId: { type: String, required: true },
        questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true, index: true },
        isAccepted: { type: Boolean, default: false },
        votes: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Answer = mongoose.model<IAnswer>("Answer", AnswerSchema);
