import { Elysia } from "elysia";
import { ProxyController } from "../controllers/proxy.controller";

const authRoute = new Elysia({ prefix: "/auth" })
    .all("/*", ProxyController.forwardToAuth);

export default authRoute;
