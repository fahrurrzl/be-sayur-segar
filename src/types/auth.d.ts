import { z } from "zod";
import { registerSchema } from "../schema/auth.schema";

export type TRegister = z.infer<typeof registerSchema>;
export type TLogin = {
  email: string;
  password: string;
};
