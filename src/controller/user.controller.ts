import { Response } from "express";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";

export default {
  async index(req: IReqUser, res: Response) {
    const { search, page, limit } = req.query;

    try {
      const users = await prisma.user.findMany({
        where: {
          ...(search
            ? {
                name: {
                  contains: search as string,
                  mode: "insensitive",
                },
              }
            : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        ...(limit ? { take: Number(limit) } : {}),
        ...(page ? { skip: (Number(page) - 1) * Number(limit) } : {}),
      });

      const total = await prisma.user.count({
        where: {
          ...(search
            ? {
                name: {
                  contains: search as string,
                  mode: "insensitive",
                },
              }
            : {}),
        },
      });

      return res.status(200).json({
        message: "Users fetched successfully",
        data: {
          users,
          totalPage: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          total,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json({
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async destroy(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await prisma.user.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "User deleted successfully",
        data: user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
