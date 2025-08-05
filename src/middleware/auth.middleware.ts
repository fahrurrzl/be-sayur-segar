import { NextFunction, Request, Response } from "express";
import { getUser } from "../utils/jwt";

export default function (req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({
      message: "Unauthorization",
    });
  }

  const [prefix, token] = authorization.split(" ");

  if (!(prefix === "Bearer" && token)) {
    return res.status(401).json({
      message: "Unauthorization",
    });
  }

  try {
    const user = getUser(token);

    if (!user) {
      return res.status(401).json({
        message: "Unauthorization",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
