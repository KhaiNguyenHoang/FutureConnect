import { Context } from "elysia";
import { Token } from "../models/token.schema";
import redis from "../config/redis";

interface LogoutBody {
  refreshToken: string;
}

export const logoutController = async ({
  body,
  set,
}: Context & { body: LogoutBody; set: any }) => {
  try {
    const { refreshToken } = body;

    if (refreshToken) {
      const tokenDoc = await Token.findOne({ token: refreshToken, type: "refresh" });
      if (tokenDoc) {
        await redis.del(`user:${tokenDoc.userId}`);
        await tokenDoc.deleteOne();
      }
    }

    return {
      message: "Logout successful",
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Logout failed" };
  }
};
