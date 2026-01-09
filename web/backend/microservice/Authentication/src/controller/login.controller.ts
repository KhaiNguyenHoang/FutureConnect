import type { Context } from "elysia";
import { User } from "../models/user.schema";
import { Token } from "../models/token.schema";
import redis from "../config/redis";
import { publishEvent } from "../config/rabbitmq";

interface LoginBody {
  email: string;
  password: string;
}

interface JWT {
  sign(payload: any): Promise<string>;
  verify(token: string): Promise<any>;
}

interface LoginContext {
  body: LoginBody;
  jwt: JWT;
  set: {
    status?: number | string;
  };
}

interface ErrorResponse {
  message: string;
}

interface SuccessResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

type LoginResponse = ErrorResponse | SuccessResponse;

export const loginController = async ({
  body,
  set,
  jwt,
}: Context & LoginContext): Promise<LoginResponse> => {
  const { email, password } = body;

  if (!email || !password) {
    set.status = 400;
    return { message: "Email and password are required" };
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    set.status = 401;
    return { message: "Invalid credentials" };
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    set.status = 401;
    return { message: "Invalid credentials" };
  }

  const accessToken = await jwt.sign({
    userId: user._id.toString(),
    type: "access",
  });

  const refreshToken = await jwt.sign({
    userId: user._id.toString(),
    type: "refresh",
  });

  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

  await Token.create({
    userId: user._id,
    token: refreshToken,
    type: "refresh",
    expiresAt: refreshTokenExpiresAt,
  });

  const userResponse = {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
  };

  // Cache user data
  await redis.set(`user:${user._id}`, JSON.stringify(userResponse), "EX", 3600);

  // Publish User Logged In Event
  await publishEvent("auth_events", {
    event: "USER_LOGGED_IN",
    data: {
      userId: user._id.toString(),
      email: user.email,
    },
  });

  return {
    message: "Login successful",
    accessToken,
    refreshToken,
    user: userResponse,
  };
};
