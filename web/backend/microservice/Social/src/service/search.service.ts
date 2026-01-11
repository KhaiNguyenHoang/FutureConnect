import { InferContext } from "elysia";
import { App } from "../setup";
import { Post } from "../models/post.model";
import { Question } from "../models/question.model";
import { Group } from "../models/group.model";

type Context = Omit<InferContext<App>, "params"> & {
    params: Record<string, string>;
};

export const searchService = async (query: any, ctx: Context) => {
    try {
        const q = query.q || "";
        const type = query.type;
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;

        if (!q) return { data: [], metadata: { total: 0, page, limit } };

        const regex = new RegExp(q, "i");
        let data: any[] = [];
        let total = 0;

        if (type === "post") {
            const [results, count] = await Promise.all([
                Post.find({ content: regex }).skip(skip).limit(limit).lean(),
                Post.countDocuments({ content: regex }),
            ]);
            data = results;
            total = count;
        } else if (type === "group") {
            const [results, count] = await Promise.all([
                Group.find({ name: regex }).skip(skip).limit(limit).lean(),
                Group.countDocuments({ name: regex }),
            ]);
            data = results;
            total = count;
        } else if (type === "question") {
            const [results, count] = await Promise.all([
                Question.find({ $text: { $search: q } }).skip(skip).limit(limit).lean(),
                Question.countDocuments({ $text: { $search: q } }),
            ]);
            data = results;
            total = count;
        }

        return {
            data,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        console.error("Search Error:", error);
        ctx.set.status = 500;
        return { message: "Internal server error" };
    }
}
