import type { Context } from "elysia";
import { User } from "../models/user.schema";

interface LoginBody {
  email: string;
  password: string;
}

interface JWTPayload {
  userId: string;
  [key: string]: any;
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

// Response types
interface ErrorResponse {
  message: string;
}

interface SuccessResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

type LoginResponse = ErrorResponse | SuccessResponse;

// Controller
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
  });

  return {
    message: "Login successful",
    accessToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
    },
  };
};
