import { InferContext } from "elysia";
import { App } from "../setup";
import { Question } from "../models/question.model";
import { Answer } from "../models/answer.model";
import { Vote } from "../models/vote.model";
import { TrendingService } from "./trending.service";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

export const askQuestionService = async (body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const { title, body: qBody, tags } = body;

        const question = new Question({
            authorId: userId,
            title,
            body: qBody,
            tags
        });
        await question.save();

        if (tags) {
            for (const tag of tags) {
                await TrendingService.trackTagUsage(tag);
            }
        }
        return question.toObject();
    } catch (error) {
        console.error("Ask Question Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const answerQuestionService = async (params: { id: string }, body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const questionId = params.id;
        const { body: aBody } = body;

        const answer = new Answer({
            authorId: userId,
            questionId,
            body: aBody
        });
        await answer.save();
        return answer.toObject();
    } catch (error) {
        console.error("Answer Question Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const voteService = async (body: any, ctx: Context) => {
    try {
        const userId = ctx.headers["x-user-id"] || body.userId;
        if (!userId) {
            ctx.set.status = 401;
            return { message: "Unauthorized" };
        }

        const { targetId, targetType, value } = body;

        const existingVote = await Vote.findOne({ userId, targetId, targetType }).lean();
        let increment = value;

        if (existingVote) {
            // Correct logic for vote change (using Vote model updates, not saving lean doc)
            if (existingVote.value === value) {
                return existingVote;
            }
            increment = value - existingVote.value;
            await Vote.updateOne({ userId, targetId, targetType }, { value });
        } else {
            const vote = new Vote({ userId, targetId, targetType, value });
            await vote.save();
        }

        if (targetType === "Question") {
            await Question.findByIdAndUpdate(targetId, { $inc: { votes: increment } });
            await TrendingService.trackQuestionActivity(targetId, increment > 0 ? 2 : -2);
        } else {
            await Answer.findByIdAndUpdate(targetId, { $inc: { votes: increment } });
        }

        return { success: true };
    } catch (error) {
        console.error("Vote Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}

export const getTrendingQuestionsService = async (ctx: Context) => {
    try {
        return await TrendingService.getTrendingQuestions();
    } catch (error) {
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}
