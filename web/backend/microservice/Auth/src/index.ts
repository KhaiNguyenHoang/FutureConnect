import authRoute from "./router/auth.route";
import { app } from "./setup";

const bootstrap = async () => {
  try {
    app.use(authRoute);
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
    app.listen(3001);
    console.log(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
    );
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

bootstrap();
