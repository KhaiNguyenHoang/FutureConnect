import { Context } from "elysia";
import { db } from "../utils/database.util";
import { techSchema } from "../database/schema";
import { eq } from "drizzle-orm";
import redis from "../utils/redis.util";

interface TechBody {
  nameBody: string;
}

export const addTech = async (body: TechBody, ctx: Context) => {
  try {
    const name = body.nameBody?.trim();

    if (!name) {
      ctx.set.status = 400;
      return { message: "Missing name body" };
    }

    await db.insert(techSchema).values({ name });

    ctx.set.status = 201;
    return {
      message: "Tech created successfully",
    };
  } catch (error: any) {
    if (error?.code === "23505") {
      ctx.set.status = 409;
      return { message: "Tech already exists" };
    }

    console.error("Error adding tech:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

export const getTech = async (params: any, ctx: Context) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return { message: "Missing id" };
    }

    const cacheKey = `tech:${id}`;
    const cachedTech = await redis.get(cacheKey);

    if (cachedTech) {
      ctx.set.status = 200;
      return { message: "Tech found (cached)", tech: JSON.parse(cachedTech) };
    }

    const tech = await db
      .select()
      .from(techSchema)
      .where(eq(techSchema.id, id));

    if (!tech.length) {
      ctx.set.status = 404;
      return { message: "Tech not found" };
    }

    await redis.set(cacheKey, JSON.stringify(tech), "EX", 3600);

    ctx.set.status = 200;
    return { message: "Tech found", tech };
  } catch (error: any) {
    console.error("Error getting tech:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

export const updateTech = async (params: any, body: TechBody, ctx: Context) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return { message: "Missing id" };
    }

    const name = body.nameBody?.trim();

    if (!name) {
      ctx.set.status = 400;
      return { message: "Missing name body" };
    }

    await db.update(techSchema).set({ name }).where(eq(techSchema.id, id));

    await redis.del(`tech:${id}`);

    ctx.set.status = 200;
    return { message: "Tech updated successfully" };
  } catch (error: any) {
    console.error("Error updating tech:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

export const deleteTech = async (params: any, ctx: Context) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return { message: "Missing id" };
    }

    await db.delete(techSchema).where(eq(techSchema.id, id));

    await redis.del(`tech:${id}`);

    ctx.set.status = 200;
    return { message: "Tech deleted successfully" };
  } catch (error: any) {
    console.error("Error deleting tech:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};
