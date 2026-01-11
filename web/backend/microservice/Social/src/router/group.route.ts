import { Elysia, t } from "elysia";
import { createGroupService, joinGroupService, getGroupConfigService } from "../service/group.service";

const groupRoute = new Elysia({ prefix: "/groups" })
    .post("/", async (ctx) => {
        return createGroupService(ctx.body, ctx as any);
    }, {
        body: t.Object({
            name: t.String(),
            description: t.Optional(t.String()),
            privacy: t.Optional(t.String()),
            userId: t.Optional(t.String())
        })
    })
    .post("/:id/join", async (ctx) => {
        return joinGroupService(ctx.params, ctx.body, ctx as any);
    }, {
        body: t.Object({ userId: t.Optional(t.String()) })
    })
    .get("/:id", async (ctx) => {
        return getGroupConfigService(ctx.params, ctx as any);
    });

export default groupRoute;
