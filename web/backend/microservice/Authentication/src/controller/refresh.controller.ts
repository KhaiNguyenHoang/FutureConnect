import { Context } from "elysia"; export const refreshController = ({ set }: Context) => { set.status = 501; return { message: "Not implemented" }; };
