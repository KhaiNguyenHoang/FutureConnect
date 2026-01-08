import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import corsConfig from "./config/cors";
import authRoute from "./router/auth.route";
import { connectDatabase } from "./config/database";

async function bootstrap() {
  await connectDatabase();

  const app = new Elysia();

  app.use(cors(corsConfig));
  app.use(openapi());
  app.use(authRoute);

  app.listen(3001);

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

bootstrap();
