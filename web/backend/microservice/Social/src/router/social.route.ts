import { Elysia, t } from "elysia";
import { followUserService, unfollowUserService, likeTargetService, getTrendingTagsService } from "../service/social.service";

const socialRoute = new Elysia({ prefix: "/social" })
    .post("/follow/:id", async (ctx) => {
        return followUserService(ctx.params, ctx as any);
    }, {
        body: t.Object({ userId: t.Optional(t.String()) })
    })
    .post("/:id/like", async (ctx) => {
        return likeTargetService(ctx.params, ctx.body, ctx as any);
    }, {
        body: t.Object({
            userId: t.Optional(t.String()),
            type: t.Optional(t.String())
        })
    })
    .get("/trending/tags", async (ctx) => {
        return getTrendingTagsService(ctx as any);
    });

export default socialRoute;
