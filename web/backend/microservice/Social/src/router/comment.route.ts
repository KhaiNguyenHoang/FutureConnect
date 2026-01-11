
import { Elysia, t } from "elysia";
import { addCommentService, getCommentsService, getRepliesService } from "../service/comment.service";

const commentRoute = new Elysia({ prefix: "/comments" })
    .post("/", async (ctx) => {
        return addCommentService(ctx.body as any, ctx as any);
    }, {
        body: t.Object({
            content: t.String(),
            postId: t.String(),
            parentId: t.Optional(t.String()),
            userId: t.Optional(t.String()),
            media: t.Optional(t.Array(t.String()))
        })
    })
    .get("/post/:postId", async (ctx) => {
        return getCommentsService(ctx.params, ctx.query, ctx as any);
    })
    .get("/:commentId/replies", async (ctx) => {
        return getRepliesService(ctx.params, ctx.query, ctx as any);
    });

export default commentRoute;
