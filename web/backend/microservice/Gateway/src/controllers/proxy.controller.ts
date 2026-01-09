import { Context } from "elysia";
import { proxyRequest } from "../services/proxy";
import { services } from "../config/services";

export const ProxyController = {
    forwardToAuth: async (ctx: Context) => {
        const path = ctx.path.replace("/auth", "");
        return await proxyRequest(services.auth.url, path, ctx);
    },
};
