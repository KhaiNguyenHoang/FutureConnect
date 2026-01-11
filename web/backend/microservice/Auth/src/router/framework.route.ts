import Elysia, { t } from "elysia";
import {
  addFramework,
  deleteFramework,
  getFramework,
  updateFramework,
} from "../service/framework.service";
import { baseApp } from "../setup";

export const frameworkRoute = new Elysia({ prefix: "/framework" })
  .use(baseApp)
  .get(
    "/:id",
    async (ctx) => {
      return getFramework(ctx.params, ctx);
    },
    {
      body: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/",
    async (ctx) => {
      return addFramework(ctx.body, ctx);
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          error: "Name is required",
        }),
        tech_name: t.String({
          minLength: 1,
          error: "Tech name is required",
        }),
      }),
    },
  )
  .put(
    "/:id",
    async (ctx) => {
      return updateFramework(ctx.params, ctx.body, ctx);
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          error: "Name is required",
        }),
        tech_name: t.String({
          minLength: 1,
          error: "Tech name is required",
        }),
      }),
    },
  )
  .delete(
    "/",
    async (ctx) => {
      return deleteFramework(ctx.params, ctx);
    },
    {
      body: t.Object({
        id: t.String(),
      }),
    },
  );
