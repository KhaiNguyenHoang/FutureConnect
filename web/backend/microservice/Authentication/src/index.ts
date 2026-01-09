import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import openapi from "@elysiajs/openapi";
import corsConfig from "./config/cors";
import { connectDatabase } from "./config/database";
import { connectRabbitMQ } from "./config/rabbitmq";
import { startDbSyncWorker } from "./workers/db-sync.worker";
import "./config/redis"; // Initialize Redis connection
import { jwtPlugin } from "./util/jwt";
import authRoute from "./router/auth.route";
import technologyRoute from "./router/technology.route";
import userRoute from "./router/user.route";

async function bootstrap() {
  await connectDatabase();
  await connectRabbitMQ();
  await startDbSyncWorker();

  const app = new Elysia();

  app.use(cors(corsConfig));
  app.use(openapi());
  app.use(jwtPlugin);
  app.use(authRoute);
  app.use(technologyRoute);
  app.use(userRoute);

  app.listen(3001);

  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

bootstrap();
