import Elysia, { t } from "elysia";
import { getUser, updateUser, deleteUser } from "../service/user.service";
import { baseApp } from "../setup";

export const userRoute = new Elysia({ prefix: "/user" })
  .use(baseApp)
  .get("/:id", async (ctx) => {
    return getUser(ctx.params, ctx);
  })
  .put(
    "/:id",
    async (ctx) => {
      return updateUser(ctx.params, ctx.body, ctx);
    },
    {
      body: t.Object({
        username: t.Optional(t.String()),
        github_url: t.Optional(t.String()),
        linkedin_url: t.Optional(t.String()),
        avatar_url: t.Optional(t.String()),
      }),
    },
  )
  .delete("/:id", async (ctx) => {
    return deleteUser(ctx.params.id, ctx);
  });
