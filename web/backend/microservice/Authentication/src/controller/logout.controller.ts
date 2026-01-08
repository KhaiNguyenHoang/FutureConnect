import { Context } from "elysia"; export const logoutController = ({ set }: Context) => { set.status = 501; return { message: "Not implemented" }; };
