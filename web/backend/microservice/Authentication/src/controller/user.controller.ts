import type { Context } from "elysia";
import mongoose from "mongoose";
import { User } from "../models/user.schema";

interface UpdateUserBody {
  name?: string;
  bio?: string;
  dateOfBirth?: Date;
  avatar?: string;
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

interface UserContext {
  body: UpdateUserBody;
  params: {
    id: string;
  };
  set: {
    status?: number | string;
  };
  userId?: string; // From auth middleware
}

export const getUserByIdController = async ({
  params,
  set,
}: Context & { params: { id: string } }) => {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      set.status = 400;
      return { message: "Invalid user ID" };
    }

    const user = await User.findById(id).populate("technologies.tech");

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    return {
      message: "User retrieved successfully",
      user,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to retrieve user" };
  }
};

export const getUserProfileController = async ({
  userId,
  set,
}: Context & { userId?: string }) => {
  try {
    if (!userId) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    const user = await User.findById(userId).populate("technologies.tech");

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    return {
      message: "Profile retrieved successfully",
      user,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to retrieve profile" };
  }
};

export const updateUserByIdController = async ({
  params,
  body,
  set,
}: Context & UserContext) => {
  try {
    const { id } = params;
    const updates = body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      set.status = 400;
      return { message: "Invalid user ID" };
    }

    // Process technologies if present
    let updateData: any = { ...updates };
    if (updates.technologies) {
      updateData.technologies = updates.technologies.map((t) => ({
        ...t,
        tech: new mongoose.Types.ObjectId(t.tech),
      }));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("technologies.tech");

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    return {
      message: "User updated successfully",
      user,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to update user" };
  }
};

export const deleteUserByIdController = async ({
  params,
  set,
}: Context & { params: { id: string } }) => {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      set.status = 400;
      return { message: "Invalid user ID" };
    }

    const user = await User.findById(id);

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    await user.softDelete();

    return {
      message: "User deleted successfully",
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to delete user" };
  }
};

export const userController = {
  getUserById: getUserByIdController,
  getUserProfile: getUserProfileController,
  updateUserById: updateUserByIdController,
  deleteUserById: deleteUserByIdController,
};
