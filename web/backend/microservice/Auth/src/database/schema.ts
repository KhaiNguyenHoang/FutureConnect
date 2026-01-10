import {
  integer,
  pgEnum,
  pgTable,
  varchar,
  primaryKey,
  index,
  timestamp,
  unique,
  PgColumn,
  PgTableWithColumns,
  boolean,
} from "drizzle-orm/pg-core";

export const userSchema = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: varchar({ length: 50 }).notNull().unique(),
  email: varchar({ length: 100 }).notNull().unique(),
  github_url: varchar({ length: 255 }).unique(),
  linkedin_url: varchar({ length: 255 }).unique(),
  avatar_url: varchar({ length: 255 }).unique(),
  password: varchar({ length: 255 }).notNull(),
  created_at: timestamp().defaultNow().notNull(),
  is_active: boolean().default(true).notNull(),
});

export const roleSchema = pgTable("role", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
});

export const userRoleSchema = pgTable(
  "user_role",
  {
    user_id: integer()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
    role_id: integer()
      .notNull()
      .references(() => roleSchema.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.role_id] }),
    roleIdx: index("user_role_role_idx").on(t.role_id),
  }),
);

export const techSchema = pgTable("tech", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
});

export const frameworkSchema = pgTable(
  "framework",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 50 }).notNull(),
    tech_id: integer()
      .notNull()
      .references(() => techSchema.id, { onDelete: "cascade" }),
  },
  (t) => ({
    techIdx: index("framework_tech_idx").on(t.tech_id),
    uniqueNamePerTech: unique("framework_name_tech_unique").on(
      t.name,
      t.tech_id,
    ),
  }),
);

export const userTechSchema = pgTable(
  "user_tech",
  {
    user_id: integer()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
    tech_id: integer()
      .notNull()
      .references(() => techSchema.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.tech_id] }),
    techIdx: index("user_tech_tech_idx").on(t.tech_id),
  }),
);

export const userFrameworkSchema = pgTable(
  "user_framework",
  {
    user_id: integer()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
    framework_id: integer()
      .notNull()
      .references(() => frameworkSchema.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.user_id, t.framework_id] }),
    frameworkIdx: index("user_framework_framework_idx").on(t.framework_id),
  }),
);

export const tokenTypeEnum = pgEnum("token_type", [
  "access",
  "refresh",
  "special",
]);

export const tokenSchema = pgTable(
  "token",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    user_id: integer()
      .notNull()
      .references(() => userSchema.id, { onDelete: "cascade" }),
    token: varchar({ length: 512 }).notNull().unique(),
    token_type: tokenTypeEnum().notNull(),
    expires_at: timestamp().notNull(), // Thêm expiry time
    created_at: timestamp().defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("token_user_idx").on(t.user_id),
    tokenIdx: index("token_token_idx").on(t.token), // Index cho việc lookup token
    expiryIdx: index("token_expiry_idx").on(t.expires_at), // Index cho cleanup
  }),
);
function defineRelations(arg0: {
  roleSchema: PgTableWithColumns<{
    name: "role";
    schema: undefined;
    columns: {
      id: PgColumn<
        {
          name: "id";
          tableName: "role";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: true;
          hasDefault: true;
          isPrimaryKey: true;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: undefined;
          baseColumn: never;
          identity: "always";
          generated: undefined;
        },
        {},
        {}
      >;
      name: PgColumn<
        {
          name: "name";
          tableName: "role";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 50 }
      >;
    };
    dialect: "pg";
  }>;
  userSchema: PgTableWithColumns<{
    name: "user";
    schema: undefined;
    columns: {
      id: PgColumn<
        {
          name: "id";
          tableName: "user";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: true;
          hasDefault: true;
          isPrimaryKey: true;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: undefined;
          baseColumn: never;
          identity: "always";
          generated: undefined;
        },
        {},
        {}
      >;
      username: PgColumn<
        {
          name: "username";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 50 }
      >;
      email: PgColumn<
        {
          name: "email";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 100 }
      >;
      github_url: PgColumn<
        {
          name: "github_url";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 255 }
      >;
      linkedin_url: PgColumn<
        {
          name: "linkedin_url";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 255 }
      >;
      avatar_url: PgColumn<
        {
          name: "avatar_url";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: false;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 255 }
      >;
      password: PgColumn<
        {
          name: "password";
          tableName: "user";
          dataType: "string";
          columnType: "PgVarchar";
          data: string;
          driverParam: string;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: [string, ...string[]];
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        { length: 255 }
      >;
      created_at: PgColumn<
        {
          name: "created_at";
          tableName: "user";
          dataType: "date";
          columnType: "PgTimestamp";
          data: Date;
          driverParam: string;
          notNull: true;
          hasDefault: true;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: undefined;
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
  userRoleSchema: PgTableWithColumns<{
    name: "user_role";
    schema: undefined;
    columns: {
      user_id: PgColumn<
        {
          name: "user_id";
          tableName: "user_role";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: undefined;
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        {}
      >;
      role_id: PgColumn<
        {
          name: "role_id";
          tableName: "user_role";
          dataType: "number";
          columnType: "PgInteger";
          data: number;
          driverParam: string | number;
          notNull: true;
          hasDefault: false;
          isPrimaryKey: false;
          isAutoincrement: false;
          hasRuntimeDefault: false;
          enumValues: undefined;
          baseColumn: never;
          identity: undefined;
          generated: undefined;
        },
        {},
        {}
      >;
    };
    dialect: "pg";
  }>;
}) {
  throw new Error("Function not implemented.");
}
