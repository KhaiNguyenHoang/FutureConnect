import { InferContext } from "elysia";
import { App } from "../setup";

type Context = Omit<InferContext<App>, "params"> & {
  params: Record<string, string>;
};
import { db } from "../utils/database.util";
import { and, eq } from "drizzle-orm";
import { tokenSchema, userSchema } from "../database/schema";
import { hashPassword, verifyPassword } from "../utils/password.util";
import redis from "../utils/redis.util";

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  username: string;
  password: string;
  github_url?: string;
  linkedin_url?: string;
  avatar_url?: string;
}

interface RefreshBody {
  refreshToken: string;
}

export const loginService = async (body: LoginBody, ctx: Context) => {
  try {
    const { email, password } = body;

    if (!email || !password) {
      ctx.set.status = 400;
      return { message: "Email and password are required" };
    }

    let user;
    const cacheKey = `user:email:${email}`;
    const cachedUser = await redis.get(cacheKey);

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      const users = await db
        .select()
        .from(userSchema)
        .where(
          and(eq(userSchema.email, email), eq(userSchema.is_active, true)),
        );
      user = users[0];

      if (user) {
        await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);
      }
    }

    if (!user) {
      ctx.set.status = 401;
      return { message: "Invalid email or password" };
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      ctx.set.status = 401;
      return { message: "Invalid email or password" };
    }

    const accessToken = await ctx.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

    await db.insert(tokenSchema).values({
      user_id: user.id,
      token: refreshToken,
      token_type: "refresh",
      expires_at: tokenExpiresAt,
    });

    await redis.set(
      `token:${refreshToken}`,
      JSON.stringify({
        user_id: user.id,
        token: refreshToken,
        expires_at: tokenExpiresAt,
      }),
      "EX",
      60 * 60 * 24 * 7,
    );

    ctx.set.status = 200;
    return {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

export const registerService = async (body: RegisterBody, ctx: Context) => {
  try {
    const { email, username, password, github_url, linkedin_url, avatar_url } =
      body;

    if (!email || !username || !password) {
      ctx.set.status = 400;
      return { message: "Email, username, and password are required" };
    }

    const cacheKey = `user:email:${email}`;
    const cachedUser = await redis.get(cacheKey);

    if (cachedUser) {
      ctx.set.status = 400;
      return { message: "User already exists" };
    }

    const users = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.email, email));

    if (users.length > 0) {
      await redis.set(cacheKey, JSON.stringify(users[0]), "EX", 3600);
      ctx.set.status = 400;
      return { message: "User already exists" };
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db
      .insert(userSchema)
      .values({
        username,
        email,
        password: hashedPassword,
        github_url,
        linkedin_url,
        avatar_url,
        is_active: true,
      })
      .returning();

    await redis.set(cacheKey, JSON.stringify(user), "EX", 3600);

    const accessToken = await ctx.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await db.insert(tokenSchema).values({
      user_id: user.id,
      token: refreshToken,
      token_type: "refresh",
      expires_at: tokenExpiresAt,
    });

    await redis.set(
      `token:${refreshToken}`,
      JSON.stringify({
        user_id: user.id,
        token: refreshToken,
        expires_at: tokenExpiresAt,
      }),
      "EX",
      60 * 60 * 24 * 7,
    );

    ctx.set.status = 201;
    return {
      message: "Register successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Register error:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

export const refreshService = async (body: RefreshBody, ctx: Context) => {
  try {
    const { refreshToken } = body;

    if (!refreshToken) {
      ctx.set.status = 400;
      return { message: "Refresh token is required" };
    }

    let token;
    const cacheKey = `token:${refreshToken}`;
    const cachedToken = await redis.get(cacheKey);

    if (cachedToken) {
      token = JSON.parse(cachedToken);
    } else {
      const tokens = await db
        .select()
        .from(tokenSchema)
        .where(eq(tokenSchema.token, refreshToken));
      token = tokens[0];

      if (token) {
        const ttl = Math.ceil(
          (new Date(token.expires_at).getTime() - Date.now()) / 1000,
        );
        if (ttl > 0) {
          await redis.set(cacheKey, JSON.stringify(token), "EX", ttl);
        }
      }
    }

    if (!token) {
      ctx.set.status = 401;
      return { message: "Invalid refresh token" };
    }

    if (new Date() > new Date(token.expires_at)) {
      await db.delete(tokenSchema).where(eq(tokenSchema.token, refreshToken));
      await redis.del(cacheKey);
      ctx.set.status = 401;
      return { message: "Refresh token expired" };
    }

    let user;
    user = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.id, token.user_id))
      .then((res) => res[0]);

    if (!user) {
      ctx.set.status = 401;
      return { message: "User not found" };
    }

    const accessToken = await ctx.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    ctx.set.status = 200;
    return {
      message: "Refresh successful",
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Refresh error:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};

interface LogoutBody {
  refreshToken: string;
}

export const logoutService = async (body: LogoutBody, ctx: Context) => {
  try {
    const { refreshToken } = body;

    if (!refreshToken) {
      ctx.set.status = 400;
      return { message: "Refresh token is required" };
    }

    await db.delete(tokenSchema).where(eq(tokenSchema.token, refreshToken));
    await redis.del(`token:${refreshToken}`);

    ctx.set.status = 200;
    return { message: "Logout successful" };
  } catch (error) {
    console.error("Logout error:", error);
    ctx.set.status = 500;
    return { message: "Internal server error" };
  }
};
