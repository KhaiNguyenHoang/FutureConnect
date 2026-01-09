import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import corsConfig from "./config/cors";
import authRoute from "./routes/auth.route";

const app = new Elysia();

app.use(cors(corsConfig));

app.use(
  rateLimit({
    duration: 60000, // 1 minute
    max: 100, // limit each IP to 100 requests per duration
  })
);

app.use(authRoute);

app.listen(3000);
console.log(
  `🦊 Gateway is running at ${app.server?.hostname}:${app.server?.port}`,
);
