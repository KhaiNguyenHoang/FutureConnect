import type { Context } from "elysia";
import mongoose from "mongoose";
import { User } from "../models/user.schema";
import redis from "../config/redis";

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

    const cachedUser = await redis.get(`user:${id}`);
    if (cachedUser) {
      return {
        message: "User retrieved successfully (cached)",
        user: JSON.parse(cachedUser),
      };
    }

    const user = await User.findById(id).populate("technologies.tech");

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);

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

    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      return {
        message: "Profile retrieved successfully (cached)",
        user: JSON.parse(cachedUser),
      };
    }

    const user = await User.findById(userId).populate("technologies.tech");

    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);

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

    // Write-Behind: 1. Update Cache
    // We need to fetch current user to merge with updates for a complete cache object, 
    // or just cache what we have if we accept partial objects (but safer to have full object).
    // For performance, we might blindly update cache if we trust the input, 
    // but typically we want the real record. 
    // Optimization: Get from cache, apply updates, save back to cache.
    let cachedUserStr = await redis.get(`user:${id}`);
    let userData = cachedUserStr ? JSON.parse(cachedUserStr) : null;

    if (!userData) {
      // Fallback if not in cache (cold start), fetch from DB once
      userData = await User.findById(id).lean();
    }

    if (userData) {
      // Apply updates to the in-memory object
      // Note: This is a simplified merge. For deep objects like 'technologies', logic matches Mongoose.
      // For array replacement (technologies), we just replace.
      userData = { ...userData, ...updateData };

      // Update Redis immediately
      await redis.set(`user:${id}`, JSON.stringify(userData), "EX", 3600);
    }

    // Write-Behind: 2. Publish Event
    const { publishEvent } = await import("../config/rabbitmq");
    await publishEvent("user_updates", {
      event: "USER_DB_UPDATE",
      data: {
        userId: id,
        updateData,
      },
    });

    return {
      message: "User update queued successfully",
      user: userData || updateData, // Return the updated data immediately
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
    await redis.del(`user:${id}`);

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
