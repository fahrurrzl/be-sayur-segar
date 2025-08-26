import { Response } from "express";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";

export default {
  async index(req: IReqUser, res: Response) {
    const user = req.user;
    try {
      const seller = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!seller) {
        return res.status(404).json({ message: "seller not found" });
      }

      const wallet = await prisma.wallet.findFirst({
        where: {
          sellerId: seller?.id,
        },
      });

      if (!wallet) {
        return res.status(404).json({ message: "wallet not found" });
      }

      const walletTransaction = await prisma.walletTransaction.findMany({
        where: {
          walletId: wallet?.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!walletTransaction) {
        return res
          .status(404)
          .json({ message: "wallet transaction not found" });
      }

      res.status(200).json({
        message: "success",
        data: walletTransaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "internal error" });
    }
  },
};
