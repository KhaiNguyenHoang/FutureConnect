import type { Context } from "elysia";
import mongoose from "mongoose";
import { User } from "../models/user.schema";

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  name?: string;
  dateOfBirth: Date;
  avatar?: string;
  googleId?: string;
  githubId?: string;
  linkedinId?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  technologies?: Array<{
    tech: string;
    framework?: string;
    level: "beginner" | "intermediate" | "advanced";
    years?: number;
  }>;
}

interface JWT {
  sign(payload: any): Promise<string>;
  verify(token: string): Promise<any>;
}

interface RegisterContext {
  body: RegisterBody;
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
  user: {
    id: string;
    email: string;
    username: string;
  };
}

type RegisterResponse = ErrorResponse | SuccessResponse;

const registerController = async ({
  body,
  set,
  jwt,
}: Context & RegisterContext): Promise<RegisterResponse> => {
  const {
    username,
    email,
    password,
    name,
    dateOfBirth,
    avatar,
    googleId,
    githubId,
    linkedinId,
    social,
    technologies,
  } = body;

  if (!username || !email || !password || !dateOfBirth) {
    set.status = 400;
    return {
      message: "Username, email, password, and date of birth are required",
    };
  }

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    set.status = 400;
    return { message: "Email already exists" };
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    set.status = 400;
    return { message: "Username already exists" };
  }

  try {
    const newUser = await User.create({
      username,
      email,
      password,
      name,
      dateOfBirth,
      avatar,
      googleId,
      githubId,
      linkedinId,
      social,
      technologies:
        technologies?.map((t) => ({
          ...t,
          tech: new mongoose.Types.ObjectId(t.tech),
        })) || [],
    });

    const accessToken = await jwt.sign({
      userId: newUser._id.toString(),
    });

    return {
      message: "Registration successful",
      accessToken,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username,
      },
    };
  } catch (error: any) {
    set.status = 500;
    return {
      message: error.message || "Registration failed",
    };
  }
};

export default registerController;
