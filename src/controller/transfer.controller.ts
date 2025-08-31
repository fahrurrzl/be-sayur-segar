import { Response } from "express";
import { Payout } from "../utils/xendit";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";
import { WalletTransactionStatus } from "@prisma/client";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      const {
        amount,
        accountNumber,
        accountHolderName,
        channelCode,
        referenceId,
      } = req.body;

      const payoutRes = await Payout.createPayout({
        data: {
          referenceId,
          channelCode,
          channelProperties: {
            accountNumber,
            accountHolderName,
          },
          amount,
          currency: "IDR",
          description: "Transfer payout",
        },
        idempotencyKey: `payout-${Date.now()}`,
      });

      res.status(200).json({
        message: "Success",
        data: payoutRes,
      });
    } catch (error: any) {
      console.error("Error creating payout:", error);
      return res.status(500).json({ message: error.message });
    }
  },
  async payoutWebhook(req: IReqUser, res: Response) {
    const event = req.body;

    try {
      const referenceId = event?.data?.reference_id;

      // TODO: update database sesuai referenceId
      await prisma.walletTransaction.update({
        where: {
          id: referenceId,
        },
        data: {
          status: WalletTransactionStatus.success,
        },
      });

      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("Error handling webhook:", err.message);
      res.status(500).json({ message: "Webhook error" });
    }
  },
};
