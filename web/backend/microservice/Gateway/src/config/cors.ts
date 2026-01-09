import { CORSConfig } from "@elysiajs/cors";

const corsConfig: CORSConfig = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["*"],
  credentials: true,
};

export default corsConfig;
