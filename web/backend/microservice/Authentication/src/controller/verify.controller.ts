import type { Context } from "elysia";

interface JWT {
  sign(payload: any): Promise<string>;
  verify(token?: string): Promise<any>;
}

interface VerifyContext {
  jwt: JWT;
  headers: Record<string, string | undefined>;
  set: {
    status?: number | string;
  };
}

export const verifyJwtController = async ({
  jwt,
  headers,
  set,
}: Context & VerifyContext) => {
  try {
    const authHeader = headers.authorization || headers.Authorization;

    if (!authHeader) {
      set.status = 401;
      return {
        success: false,
        message: "No authorization token provided",
      };
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid token format",
      };
    }

    const payload = await jwt.verify(token);

    if (!payload || !payload.userId) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid token payload",
      };
    }

    return {
      success: true,
      message: "Token verified successfully",
      data: {
        userId: payload.userId,
        iat: payload.iat,
        exp: payload.exp,
      },
    };
  } catch (error: any) {
    set.status = 401;
    return {
      success: false,
      message: error.message || "Invalid or expired token",
    };
  }
};

export const authMiddleware = async ({
  jwt,
  headers,
  set,
}: Context & VerifyContext) => {
  try {
    const authHeader = headers.authorization || headers.Authorization;

    if (!authHeader) {
      set.status = 401;
      throw new Error("No authorization token provided");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const payload = await jwt.verify(token);

    if (!payload || !payload.userId) {
      set.status = 401;
      throw new Error("Invalid token");
    }

    return {
      userId: payload.userId,
    };
  } catch (error: any) {
    set.status = 401;
    throw new Error(error.message || "Unauthorized");
  }
};

export const verifyJwtInternalController = async ({
  body,
  jwt,
  set,
}: Context & { body: { token: string }; jwt: JWT; set: any }) => {
  try {
    const { token } = body;

    if (!token) {
      set.status = 400;
      return {
        success: false,
        message: "Token is required",
      };
    }

    const payload = await jwt.verify(token);

    if (!payload || !payload.userId) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid token",
      };
    }

    return {
      success: true,
      message: "Token verified successfully",
      data: {
        userId: payload.userId,
        iat: payload.iat,
        exp: payload.exp,
      },
    };
  } catch (error: any) {
    set.status = 401;
    return {
      success: false,
      message: error.message || "Invalid or expired token",
    };
  }
};

export const getUserFromTokenController = async ({
  jwt,
  headers,
  set,
}: Context & VerifyContext) => {
  try {
    const authHeader = headers.authorization || headers.Authorization;

    if (!authHeader) {
      set.status = 401;
      return {
        success: false,
        message: "No authorization token provided",
      };
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    const payload = await jwt.verify(token);

    if (!payload || !payload.userId) {
      set.status = 401;
      return {
        success: false,
        message: "Invalid token",
      };
    }

    const { User } = await import("../models/user.schema");
    const user = await User.findById(payload.userId);

    if (!user) {
      set.status = 404;
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User retrieved successfully",
      data: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
      },
    };
  } catch (error: any) {
    set.status = 401;
    return {
      success: false,
      message: error.message || "Unauthorized",
    };
  }
};
