import { Context } from "elysia";
export const forgotPasswordController = ({ set }: Context) => {
  set.status = 501;
  return { message: "Not implemented" };
};
