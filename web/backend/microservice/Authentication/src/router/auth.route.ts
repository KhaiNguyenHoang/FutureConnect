import Elysia from "elysia";

const authRoute = new Elysia({ prefix: "/api/auth" })
  .get("/login", () => "login")
  .post("/register", () => "register")
  .get("/logout", () => "logout")
  .post("/refresh", () => "refresh")
  .get("/verify", () => "verify")
  .get("/verify-email", () => "verify email")
  .get("/forgot-password", () => "forgot password")
  .post("/reset-password", () => "reset password")
  .get("/get-user-info", () => "get user info");

export default authRoute;
