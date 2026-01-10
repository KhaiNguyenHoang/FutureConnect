import { Elysia } from "elysia";

const app = new Elysia()
    .get("/", () => "Hello from Social Service")
    .listen(3002);

console.log(
    `🦊 Social Service is running at ${app.server?.hostname}:${app.server?.port}`
);
