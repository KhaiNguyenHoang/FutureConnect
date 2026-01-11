import { Elysia, t } from "elysia";
import { askQuestionService, answerQuestionService, voteService, getTrendingQuestionsService } from "../service/qa.service";

const qaRoute = new Elysia({ prefix: "/qa" })
    .post("/questions", async (ctx) => {
        return askQuestionService(ctx.body, ctx as any);
    }, {
        body: t.Object({
            title: t.String(),
            body: t.String(),
            tags: t.Optional(t.Array(t.String())),
            userId: t.Optional(t.String())
        })
    })
    .post("/questions/:id/answers", async (ctx) => {
        return answerQuestionService(ctx.params, ctx.body, ctx as any);
    }, {
        body: t.Object({
            body: t.String(),
            userId: t.Optional(t.String())
        })
    })
    .post("/vote", async (ctx) => {
        return voteService(ctx.body, ctx as any);
    }, {
        body: t.Object({
            targetId: t.String(),
            targetType: t.String(),
            value: t.Number(),
            userId: t.Optional(t.String())
        })
    })
    .get("/trending", async (ctx) => {
        return getTrendingQuestionsService(ctx as any);
    });

export default qaRoute;
