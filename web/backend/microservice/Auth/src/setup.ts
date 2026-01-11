import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import corsConfig from "./config/cors.config";
import jwt from "@elysiajs/jwt";
import { jwtConfig } from "./config/jwt.config";
import { rateLimit } from "elysia-rate-limit";
import swagger from "@elysiajs/swagger";

export const baseApp = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Auth Microservice",
          version: "1.0.50",
        },
      },
    }),
  )
  .use(cors(corsConfig))
  .use(jwt(jwtConfig))
  .use(
    rateLimit({
      duration: 60000,
      max: 1000,
      generator: (req, server) => server?.requestIP(req)?.address ?? "",
      errorResponse: new Response("Rate limit exceeded", {
        status: 429,
      }),
    }),
  );

export const app = new Elysia().use(baseApp);

export type App = typeof app;
