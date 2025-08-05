import { z } from "zod";
import { registerSchema } from "../schema/auth.schema";

export type TRegister = z.infer<typeof registerSchema>;
export type TLogin = {
  email: string;
  password: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export type IReqUser = Request;
