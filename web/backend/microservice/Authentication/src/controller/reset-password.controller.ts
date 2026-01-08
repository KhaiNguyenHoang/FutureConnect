import { Context } from "elysia";
import bcrypt from "bcryptjs";
import { User } from "../models/user.schema";
import { Token } from "../models/token.schema";

interface ResetPasswordBody {
  userId: string;
  resetToken: string;
  password: string;
}

export const resetPasswordController = async ({
  body,
  set,
}: Context & { body: ResetPasswordBody; set: any }) => {
  try {
    const { userId, resetToken, password } = body;

    if (!userId || !resetToken || !password) {
      set.status = 400;
      return { message: "User ID, token, and password are required" };
    }

    const token = await Token.findOne({ token: resetToken, type: "reset" });

    if (!token) {
      set.status = 401;
      return { message: "Invalid reset token" };
    }

    if (token.expiresAt < new Date()) {
      set.status = 401;
      await Token.deleteOne({ token: resetToken, type: "reset" });
      return { message: "Reset token expired" };
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      set.status = 404;
      return { message: "User not found" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    await Token.deleteOne({ token: resetToken, type: "reset" });

    return {
      message: "Password reset successfully",
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to reset password" };
  }
};
