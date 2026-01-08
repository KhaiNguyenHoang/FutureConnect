import mongoose from "mongoose";

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/auth";

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
