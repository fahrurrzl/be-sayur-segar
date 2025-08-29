import { Response } from "express";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";
import { Prisma } from "@prisma/client";
import { Balance } from "../utils/xendit";

export default {
  async create(req: IReqUser, res: Response) {
    const user = req?.user;

    try {
      const seller = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not found",
        });
      }

      const walletExists = await prisma.wallet.findFirst({
        where: {
          sellerId: seller?.id,
        },
      });

      if (walletExists) {
        return res.status(400).json({
          message: "Wallet already exists",
        });
      }

      const wallet = await prisma.wallet.create({
        data: {
          sellerId: seller?.id,
        },
      });

      return res.status(201).json({
        message: "Wallet created successfully",
        data: wallet,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return res.status(400).json({
          message: error.message,
          code: error.code,
          meta: error.meta,
        });
      }

      console.error("Wallet create error:", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async index(req: IReqUser, res: Response) {
    try {
      const balance = await Balance.getBalance({
        currency: "IDR",
      });

      return res.status(200).json({
        message: "Balance fetched successfully",
        data: balance,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
