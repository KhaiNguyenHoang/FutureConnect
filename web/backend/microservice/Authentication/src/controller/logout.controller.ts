import { Context } from "elysia";
import { Token } from "../models/token.schema";

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
      await Token.deleteOne({ token: refreshToken, type: "refresh" });
    }

    return {
      message: "Logout successful",
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Logout failed" };
  }
};
