import { Elysia, t } from "elysia";
import {
  getUserByIdController,
  updateUserByIdController,
  deleteUserByIdController,
  getUserProfileController,
} from "../controller/user.controller";
import { authMiddleware } from "../controller/verify.controller";
import { jwtPlugin } from "../util/jwt";

const userRoute = new Elysia({ prefix: "/api/users" })
  .use(jwtPlugin)
  .get("/me", getUserProfileController, {
    beforeHandle: authMiddleware,
  })
  .get("/:id", getUserByIdController)
  .put("/:id", updateUserByIdController, {
    body: t.Object({
      name: t.Optional(t.String()),
      bio: t.Optional(t.String()),
      dateOfBirth: t.Optional(t.Date()),
      avatar: t.Optional(t.String()),
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
  .delete("/:id", deleteUserByIdController);

export default userRoute;
