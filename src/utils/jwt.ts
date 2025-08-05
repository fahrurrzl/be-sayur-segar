import jwt from "jsonwebtoken";
import env from "./env";

interface IUserToken {
  id: string;
  email: string;
  role: string;
}

export const generateToken = (user: IUserToken): string => {
  return jwt.sign(user, env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

export const getUser = (token: string): IUserToken => {
  return jwt.verify(token, env.JWT_SECRET) as IUserToken;
};
