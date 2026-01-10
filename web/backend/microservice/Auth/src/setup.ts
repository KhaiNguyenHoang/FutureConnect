import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import corsConfig from "./config/cors.config";
import jwt from "@elysiajs/jwt";
import { jwtConfig } from "./config/jwt.config";
import { rateLimit } from "elysia-rate-limit";

export const app = new Elysia()
    .use(cors(corsConfig))
    .use(jwt(jwtConfig))
    .use(
        rateLimit({
            duration: 60000,
            max: 100,
            errorResponse: new Response("Rate limit exceeded", {
                status: 429,
            }),
        }),
    );

export type App = typeof app;
