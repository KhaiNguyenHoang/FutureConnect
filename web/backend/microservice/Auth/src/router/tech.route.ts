import Elysia, { t } from "elysia";
import {
  addTech,
  deleteTech,
  getTech,
  updateTech,
} from "../service/tech.service";
import { app } from "../setup";

export const techRoute = new Elysia({ prefix: "/tech" })
  .use(app)
  .post(
    "/",
    async (ctx) => {
      return addTech(ctx.body, ctx);
    },
    {
      body: t.Object({
        nameBody: t.String({
          minLength: 1,
          error: "Name is required",
        }),
      }),
    },
  )
  .get(
    "/:id",
    async (ctx) => {
      return getTech(ctx.params, ctx);
    },
    {},
  )
  .put(
    "/:id",
    async (ctx) => {
      return updateTech(ctx.params, ctx.body, ctx);
    },
    {
      body: t.Object({
        nameBody: t.String({
          minLength: 1,
          error: "Name is required",
        }),
      }),
    },
  )
  .delete(
    "/:id",
    async (ctx) => {
      return deleteTech(ctx.params, ctx);
    },
    {},
  );
