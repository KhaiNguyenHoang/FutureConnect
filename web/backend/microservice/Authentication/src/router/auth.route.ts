import { Elysia, t } from "elysia";
import { loginController } from "../controller/login.controller";
import { logoutController } from "../controller/logout.controller";
import { refreshController } from "../controller/refresh.controller";
import {
  verifyJwtController,
  verifyJwtInternalController,
  getUserFromTokenController,
} from "../controller/verify.controller";
import { verifyEmailController } from "../controller/verify-email.controller";
import { forgotPasswordController } from "../controller/forgot-password.controller";
import { resetPasswordController } from "../controller/reset-password.controller";
import registerController from "../controller/register.controller";
import { jwtPlugin } from "../util/jwt";

const authRoute = new Elysia({ prefix: "/api/auth" })
  .use(jwtPlugin)
  .post("/login", loginController, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
    }),
  })
  .post("/register", registerController, {
    body: t.Object({
      username: t.String(),
      email: t.String(),
      password: t.String(),
      name: t.Optional(t.String()),
      dateOfBirth: t.Date(),
      avatar: t.Optional(t.String()),
      googleId: t.Optional(t.String()),
      githubId: t.Optional(t.String()),
      linkedinId: t.Optional(t.String()),
      social: t.Optional(
        t.Object({
          github: t.Optional(t.String()),
          linkedin: t.Optional(t.String()),
          twitter: t.Optional(t.String()),
        }),
      ),
      technologies: t.Optional(
        t.Array(
          t.Object({
            tech: t.String(),
            framework: t.Optional(t.String()),
            level: t.Union([
              t.Literal("beginner"),
              t.Literal("intermediate"),
              t.Literal("advanced"),
            ]),
            years: t.Optional(t.Number()),
          }),
        ),
      ),
    }),
  })
  .post("/logout", logoutController, {
    body: t.Object({
      refreshToken: t.String(),
    }),
  })
  .post("/refresh", refreshController, {
    body: t.Object({
      refreshToken: t.String(),
    }),
  })
  .get("/verify", verifyJwtController)
  .post("/verify-token", verifyJwtInternalController, {
    body: t.Object({
      token: t.String(),
    }),
  })
  .get("/user-from-token", getUserFromTokenController)
  .get("/verify-email", verifyEmailController)
  .post("/forgot-password", forgotPasswordController)
  .post("/reset-password", resetPasswordController, {
    body: t.Object({
      userId: t.String(),
      resetToken: t.String(),
      password: t.String({ minLength: 6 }),
    }),
  });

export default authRoute;
