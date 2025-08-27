import { Response } from "express";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";
import { WalletTransactionStatus, WalletTransactionType } from "@prisma/client";

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
        include: {
          wallet: {
            include: {
              seller: {
                select: {
                  bankName: true,
                  accountName: true,
                  accountNumber: true,
                },
              },
            },
          },
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
  async superAdminIndex(req: IReqUser, res: Response) {
    try {
      const walletTransaction = await prisma.walletTransaction.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          wallet: {
            include: {
              seller: {
                select: {
                  bankName: true,
                  accountName: true,
                  accountNumber: true,
                  storeName: true,
                  storeLocation: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!walletTransaction) {
        return res
          .status(404)
          .json({ message: "wallet transaction not found" });
      }

      res.status(200).json({
        message: "success get all wallet transaction",
        data: walletTransaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "internal error" });
    }
  },
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const walletTransaction = await prisma.walletTransaction.findFirst({
        where: {
          id,
        },
        include: {
          wallet: {
            include: {
              seller: {
                select: {
                  bankName: true,
                  accountName: true,
                  accountNumber: true,
                  storeName: true,
                  storeLocation: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!walletTransaction) {
        return res
          .status(404)
          .json({ message: "wallet transaction not found" });
      }

      res.status(200).json({
        message: "success get wallet transaction",
        data: walletTransaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "internal error" });
    }
  },
  async create(req: IReqUser, res: Response) {
    const user = req.user;
    const { amount } = req.body;

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

      if (wallet.balance < amount) {
        return res.status(400).json({ message: "Saldo tidak mencukupi" });
      }

      if (amount < 10000) {
        return res
          .status(400)
          .json({ message: "Minimal penarikan Rp. 10.000" });
      }

      const walletTransaction = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: WalletTransactionType.outcome,
          status: WalletTransactionStatus.pending,
          paymentMethod: "BANK_TRANSFER",
        },
      });

      await prisma.wallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          balance: wallet.balance - amount,
        },
      });

      res.status(201).json({
        message: "success create wallet transaction",
        data: walletTransaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error });
    }
  },
};
