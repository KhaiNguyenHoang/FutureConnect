import { Context } from "elysia";
import { db } from "../utils/database.util";
import { frameworkSchema, techSchema } from "../database/schema";
import { eq } from "drizzle-orm";
import { redis, CacheKeys } from "../utils/redis.util";

interface FrameworkBody {
  name: string;
  tech_name: string;
}

export const addFramework = async (body: FrameworkBody, ctx: Context) => {
  try {
    const { name, tech_name } = body;

    if (!name || !tech_name) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Missing name or tech_name",
      };
    }

    const tech = await db
      .select()
      .from(techSchema)
      .where(eq(techSchema.name, tech_name));

    if (!tech.length) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Tech not found",
      };
    }

    await db.insert(frameworkSchema).values({ name, tech_id: tech[0].id });

    ctx.set.status = 201;
    return {
      success: true,
      message: "Framework created successfully",
    };
  } catch (e) {
    ctx.set.status = 400;
    return {
      success: false,
      message: "Internal server error",
      error: e,
    };
  }
};

export const getFramework = async (params: any, ctx: Context) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Missing id",
      };
    }

    const cacheKey = CacheKeys.framework(id);
    const cachedFramework = await redis.getJson<any>(cacheKey);

    if (cachedFramework) {
      ctx.set.status = 200;
      return {
        success: true,
        message: "Framework found (cached)",
        framework: cachedFramework,
      };
    }

    const framework = await db
      .select()
      .from(frameworkSchema)
      .where(eq(frameworkSchema.id, id));

    if (!framework.length) {
      ctx.set.status = 404;
      return {
        success: false,
        message: "Framework not found",
      };
    }

    await redis.setJson(cacheKey, framework, 3600);

    ctx.set.status = 200;
    return {
      success: true,
      message: "Framework found",
      framework,
    };
  } catch (e) {
    ctx.set.status = 400;
    return {
      success: false,
      message: "Internal server error",
      error: e,
    };
  }
};

export const updateFramework = async (
  params: any,
  body: FrameworkBody,
  ctx: Context,
) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Missing id",
      };
    }

    const { name, tech_name } = body;

    if (!name || !tech_name) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Missing name or tech_name",
      };
    }

    const tech = await db
      .select()
      .from(techSchema)
      .where(eq(techSchema.name, tech_name));

    if (!tech.length) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Tech not found",
      };
    }

    await db
      .update(frameworkSchema)
      .set({ name, tech_id: tech[0].id })
      .where(eq(frameworkSchema.id, id));

    await redis.del(CacheKeys.framework(id));

    ctx.set.status = 200;
    return {
      success: true,
      message: "Framework updated successfully",
    };
  } catch (e) {
    ctx.set.status = 400;
    return {
      success: false,
      message: "Internal server error",
      error: e,
    };
  }
};

export const deleteFramework = async (params: any, ctx: Context) => {
  try {
    const { id } = params;

    if (!id) {
      ctx.set.status = 400;
      return {
        success: false,
        message: "Missing id",
      };
    }

    await db.delete(frameworkSchema).where(eq(frameworkSchema.id, id));

    await redis.del(CacheKeys.framework(id));

    ctx.set.status = 200;
    return {
      success: true,
      message: "Framework deleted successfully",
    };
  } catch (e) {
    ctx.set.status = 400;
    return {
      success: false,
      message: "Internal server error",
      error: e,
    };
  }
};
