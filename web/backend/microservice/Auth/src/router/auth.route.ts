import Elysia, { t } from "elysia";
import {
  loginService,
  registerService,
  refreshService,
  logoutService,
} from "../service/auth.service";
import { app } from "../setup";

const authRoute = new Elysia({ prefix: "/auth" })
  .use(app)
  .post(
    "/login",
    async (ctx) => {
      return loginService(ctx.body, ctx);
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Invalid email format",
        }),
        password: t.String({
          minLength: 6,
          error: "Password must be at least 6 characters",
        }),
      }),
    },
  )
  .post(
    "/register",
    async (ctx) => {
      return registerService(ctx.body, ctx);
    },
    {
      body: t.Object({
        email: t.String({
          format: "email",
          error: "Invalid email format",
        }),
        username: t.String({
          minLength: 3,
          error: "Username must be at least 3 characters",
        }),
        password: t.String({
          minLength: 6,
          error: "Password must be at least 6 characters",
        }),
        github_url: t.Optional(
          t.String({
            format: "uri",
            error: "Invalid GitHub URL format",
          }),
        ),
        linkedin_url: t.Optional(
          t.String({
            format: "uri",
            error: "Invalid LinkedIn URL format",
          }),
        ),
        avatar_url: t.Optional(
          t.String({
            format: "uri",
            error: "Invalid avatar URL format",
          }),
        ),
      }),
    },
  )
  .post(
    "/refresh",
    async (ctx) => {
      return refreshService(ctx.body, ctx);
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    },
  )
  .post(
    "/logout",
    async (ctx) => {
      return logoutService(ctx.body, ctx);
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    },
  );

export default authRoute;
