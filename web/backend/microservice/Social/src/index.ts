import { app } from "./setup";
import { staticPlugin } from "@elysiajs/static";
import { connectDB } from "./utils/database.util";
import { connectRabbitMQ } from "./utils/rabbitmq.util";
import postRoute from "./router/post.route";
import socialRoute from "./router/social.route";
import groupRoute from "./router/group.route";
import qaRoute from "./router/qa.route";
import searchRoute from "./router/search.route";
import commentRoute from "./router/comment.route";
import uploadRoute from "./router/upload.route";

const bootstrap = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();

    app
      .use(postRoute)
      .use(socialRoute)
      .use(groupRoute)
      .use(qaRoute)
      .use(searchRoute)
      .use(commentRoute)
      .use(uploadRoute)
      .use(staticPlugin({
        assets: "public/uploads",
        prefix: "/uploads"
      }));

    app.onError(({ code, error, set }) => {
      console.error("Global error:", { code, error });
      if (code === "VALIDATION") {
        set.status = 400;
        return {
          success: false,
          message: "Validation error",
          errors: error.message,
        };
      }

      if (code === "NOT_FOUND") {
        set.status = 404;
        return {
          success: false,
          message: "Route not found",
        };
      }

      set.status = 500;
      return {
        success: false,
        message: "Internal server error",
        error: error,
      };
    });
    app.listen(3002);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

bootstrap();
