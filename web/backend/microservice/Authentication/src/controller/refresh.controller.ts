import { Context } from "elysia";
import { Token } from "../models/token.schema";
import { User } from "../models/user.schema";

interface RefreshBody {
  refreshToken: string;
}

interface JWTPayload {
  userId: string;
  type?: string;
}

interface JWT {
  sign(payload: any): Promise<string>;
  verify(token: string): Promise<any>;
}

export const refreshController = async ({
  body,
  jwt,
  set,
}: Context & { body: RefreshBody; jwt: JWT; set: any }) => {
  try {
    const { refreshToken } = body;

    if (!refreshToken) {
      set.status = 400;
      return { message: "Refresh token is required" };
    }

    const payload = await jwt.verify(refreshToken);
    if (!payload || !payload.userId || payload.type !== "refresh") {
      set.status = 401;
      return { message: "Invalid refresh token" };
    }

    const storedToken = await Token.findOne({
      token: refreshToken,
      type: "refresh",
      isRevoked: false,
      userId: payload.userId,
    });

    if (!storedToken) {
      set.status = 401;
      return { message: "Invalid or expired refresh token" };
    }

    if (storedToken.expiresAt < new Date()) {
      set.status = 401;
      await Token.deleteOne({ _id: storedToken._id });
      return { message: "Refresh token expired" };
    }

    await Token.deleteOne({ _id: storedToken._id });

    const user = await User.findById(payload.userId);
    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    const newAccessToken = await jwt.sign({
      userId: user._id.toString(),
      type: "access",
    });

    const newRefreshToken = await jwt.sign({
      userId: user._id.toString(),
      type: "refresh",
    });

    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

    await Token.create({
      userId: user._id,
      token: newRefreshToken,
      type: "refresh",
      expiresAt: refreshTokenExpiresAt,
    });

    return {
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to refresh token" };
  }
};
