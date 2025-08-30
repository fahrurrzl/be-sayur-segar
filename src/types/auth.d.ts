import { z } from "zod";
import { registerSchema } from "../schema/auth.schema";
import { Request } from "express";

export type TRegister = z.infer<typeof registerSchema>;
export type TLogin = {
  email: string;
  password: string;
};

interface IReqUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export type TUpdate = {
  name: string;
  username: string;
  gender: string;
  birthDate: string;
  photo?: string;
  email: string;
  phone: string;
  address: string;
};

export type TChangePassword = {
  oldPassword: string;
  newPassword: string;
};
