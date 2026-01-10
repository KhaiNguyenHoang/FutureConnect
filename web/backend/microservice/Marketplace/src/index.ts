import { Elysia } from "elysia";

const app = new Elysia()
    .get("/", () => "Hello from Marketplace Service")
    .listen(3003);

console.log(
    `🦊 Marketplace Service is running at ${app.server?.hostname}:${app.server?.port}`
);
