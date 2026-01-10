import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

if (!Bun.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString: Bun.env.DATABASE_URL,
});

export const db = drizzle(pool);
