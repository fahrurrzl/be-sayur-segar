import { NextFunction, Request, Response } from "express";
import { getUser } from "../utils/jwt";
import { IReqUser } from "../types/auth";

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const [prefix, token] = authorization.split(" ");

    if (prefix !== "Bearer" || !token) {
        return res.status(401).json({ message: "Unauthorized: Invalid token format" });
    }

    try {
        const user = getUser(token);

        if (!user) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        (req as IReqUser).user = user;
        next();
    } catch (error: any) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Unauthorized: Token expired" });
        }
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}
