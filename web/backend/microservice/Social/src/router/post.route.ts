import { Elysia, t } from "elysia";
import { createPostService, getPostService, getFeedService } from "../service/post.service";

const postRoute = new Elysia({ prefix: "/posts" })
    .post("/", async (ctx) => {
        return createPostService(ctx.body as any, ctx as any);
    }, {
        body: t.Object({
            content: t.String(),
            media: t.Optional(t.Array(t.String())),
            tags: t.Optional(t.Array(t.String())),
            groupId: t.Optional(t.String()),
            userId: t.Optional(t.String())
        })
    })
    .get("/:id", async (ctx) => {
        return getPostService(ctx.params, ctx as any);
    })
    .get("/feed", async (ctx) => {
        return getFeedService(ctx.query, ctx as any);
    });

export default postRoute;
