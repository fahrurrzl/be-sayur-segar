import { RoleUser } from "@prisma/client";
import { NextFunction, Response } from "express";
import { IReqUser } from "../types/auth";

export default function (roles: RoleUser[]) {
  return (req: IReqUser, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role || !roles.includes(role as RoleUser)) {
      return res.status(403).json({
        message: "Forbidden",
        data: null,
      });
    }

    next();
  };
}
