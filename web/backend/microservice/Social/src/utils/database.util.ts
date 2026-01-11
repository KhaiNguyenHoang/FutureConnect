import mongoose from "mongoose";

const loadUrl = () => {
  const url = Bun.env.MONGODB_URL;
  if (!url) {
    throw new Error("Please set the MONGODB_URL environment variable");
  }
  return url;
};

export const connectDB = async () => {
  try {
    await mongoose.connect(loadUrl());
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
