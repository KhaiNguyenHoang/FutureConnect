import { JWTOption } from "@elysiajs/jwt";

const loadJwtSecret = () => {
  if (Bun.env.JWT_SECRET) {
    return Bun.env.JWT_SECRET;
  } else throw new Error("JWT_SECRET is not set");
};
export const jwtConfig: JWTOption = {
  name: "jwt",
  secret: loadJwtSecret(),
  exp: 60 * 60 * 24,
};
