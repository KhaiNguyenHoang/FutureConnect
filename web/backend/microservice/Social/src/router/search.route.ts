import { Elysia, t } from "elysia";
import { searchService } from "../service/search.service";

const searchRoute = new Elysia({ prefix: "/search" })
    .get("/", async (ctx) => {
        return searchService(ctx.query, ctx as any);
    });

export default searchRoute;
