import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import Elysia from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { corsConfig } from "./config/cors.config";

const baseApp = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Social Microservice",
          version: "1.0.50",
        },
      },
    }),
  )
  .use(cors(corsConfig))
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
