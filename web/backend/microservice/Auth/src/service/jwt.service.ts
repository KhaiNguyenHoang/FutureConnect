import { InferContext } from "elysia";
import { App } from "../setup";

type Context = Omit<InferContext<App>, "params"> & {
  params: Record<string, string>;
};

export class JwtService {
  static async sign<T extends Record<string, any>>(
    ctx: Context,
    payload: T,
  ) {
    return await ctx.jwt.sign(payload);
  }

  static async verify<T extends Record<string, any>>(
    ctx: Context,
  ): Promise<T> {
    const auth = ctx.request.headers.get("authorization");
    if (!auth) throw new Error("Missing Authorization header");
    const token = auth.replace(/^Bearer\s+/i, "");
    const payload = await ctx.jwt.verify(token);
    if (!payload) throw new Error("Invalid token");
    return payload as T;
  }
}
