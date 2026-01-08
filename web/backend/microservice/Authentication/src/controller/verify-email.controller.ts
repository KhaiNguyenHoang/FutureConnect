import { Context } from "elysia";
export const verifyEmailController = ({ set }: Context) => {
  set.status = 501;
  return { message: "Not implemented" };
};
