import { Context } from "elysia";
import { db } from "../utils/database.util";
import { userSchema } from "../database/schema";
import { eq } from "drizzle-orm";
import redis from "../utils/redis.util";

export const getUser = async (params: any, ctx: Context) => {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      ctx.set.status = 400;
      return { success: false, message: "Invalid user ID" };
    }
    const cacheKey = `user:${id}`;
    const cachedUser = await redis.get(cacheKey);

    if (cachedUser) {
      ctx.set.status = 200;
      return { success: true, data: JSON.parse(cachedUser) };
    }

    const users = await db
      .select({
        id: userSchema.id,
        username: userSchema.username,
        email: userSchema.email,
        github_url: userSchema.github_url,
        linkedin_url: userSchema.linkedin_url,
        avatar_url: userSchema.avatar_url,
        created_at: userSchema.created_at,
      })
      .from(userSchema)
      .where(eq(userSchema.id, id));

    const user = users[0];

    if (!user) {
      ctx.set.status = 404;
      return { success: false, message: "User not found" };
    }

    // Cache user (1 hour)
    await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);

    return { success: true, data: user };
  } catch (error) {
    console.error("Error getting user:", error);
    ctx.set.status = 500;
    return { success: false, message: "Internal server error" };
  }
};

export const updateUser = async (params: any, data: any, ctx: Context) => {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      ctx.set.status = 400;
      return { success: false, message: "Invalid user ID" };
    }

    // Prepare update data (remove undefined)
    const updateData = { ...data };

    // Perform update
    const user = await db
      .update(userSchema)
      .set(updateData)
      .where(eq(userSchema.id, id))
      .returning();

    if (!user || user.length === 0) {
      ctx.set.status = 404;
      return { success: false, message: "User not found" };
    }

    const updatedUser = user[0];

    // Invalidate caches
    // We need to invalidate `user:{id}` AND `user:email:{email}`
    // `updatedUser` has the email, so we can use it.
    await redis.del(`user:${id}`);
    if (updatedUser.email) {
      await redis.del(`user:email:${updatedUser.email}`);
    }

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user:", error);
    ctx.set.status = 500;
    return { success: false, message: "Internal server error" };
  }
};

export const deleteUser = async (userId: string, ctx: Context) => {
  try {
    const id = parseInt(userId);

    if (isNaN(id)) {
      ctx.set.status = 400;
      return { success: false, message: "Invalid user ID" };
    }

    const user = await db
      .update(userSchema)
      .set({ is_active: false })
      .where(eq(userSchema.id, id))
      .returning();

    if (!user || user.length === 0) {
      ctx.set.status = 404;
      return { success: false, message: "User not found" };
    }

    const deletedUser = user[0];

    // Invalidate caches to prevent login
    await redis.del(`user:${id}`);
    if (deletedUser.email) {
      await redis.del(`user:email:${deletedUser.email}`);
    }

    ctx.set.status = 200;
    return { message: "User deleted successfully" };
  } catch (error) {
    console.error("Error deleting user:", error);
    ctx.set.status = 500;
    return { success: false, message: "Internal server error" };
  }
};
