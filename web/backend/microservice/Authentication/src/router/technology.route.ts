import { Elysia, t } from "elysia";
import {
  createTechnologyController,
  getAllTechnologiesController,
  getTechnologyByIdController,
  getTechnologyBySlugController,
  updateTechnologyController,
  deleteTechnologyController,
  addFrameworkController,
  removeFrameworkController,
} from "../controller/technology.controller";
import { authMiddleware } from "../controller/verify.controller";
import { jwtPlugin } from "../util/jwt";

const technologyRoute = new Elysia({ prefix: "/api/technologies" })
  .use(jwtPlugin)
  .post("/", createTechnologyController, {
    beforeHandle: authMiddleware,
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String()),
      frameworks: t.Optional(t.Array(t.String())),
    }),
  })
  .get("/", getAllTechnologiesController)
  .get("/:id", getTechnologyByIdController)
  .get("/slug/:slug", getTechnologyBySlugController)
  .put("/:id", updateTechnologyController, {
    beforeHandle: authMiddleware,
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      frameworks: t.Optional(t.Array(t.String())),
    }),
  })
  .delete("/:id", deleteTechnologyController, { beforeHandle: authMiddleware })
  .post("/:id/frameworks", addFrameworkController, {
    beforeHandle: authMiddleware,
    body: t.Object({
      framework: t.String(),
    }),
  })
  .delete("/:id/frameworks", removeFrameworkController, {
    beforeHandle: authMiddleware,
  });

export default technologyRoute;
