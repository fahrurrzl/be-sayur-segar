import { z } from "zod";
import { IReqUser } from "../types/auth";
import { Response } from "express";
import { checkoutSchema } from "../schema/order.schema";
import { prisma } from "../../prisma/prisma";
import { TOrder } from "../types/order";
import { Invoice } from "../utils/xendit";

async function calculateShippingFee(sellerId: string, userAddress: string) {
  return 20000;
}

function generateOrderId(): string {
  const prefix = "ORD";

  // ambil tanggal hari ini (YYYYMMDD)
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  // random 5 digit alfanumerik
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `${prefix}${date}${random}`;
}

export default {
  // Create Order
  async create(req: IReqUser, res: Response) {
    const user = req.user;
    const { address } = req.body as unknown as TOrder;

    try {
      // validasi input user (hanya address)
      const validated = checkoutSchema.parse({
        address,
      });

      // Ambil cart user
      const cart = await prisma.cart.findFirst({
        where: { userId: user?.id },
        include: {
          items: {
            include: {
              product: { include: { seller: true } },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Group items by seller
      const itemsBySeller: Record<string, typeof cart.items> = {};
      for (const item of cart.items) {
        const sellerId = item.product.sellerId!;
        if (!itemsBySeller[sellerId]) {
          itemsBySeller[sellerId] = [];
        }
        itemsBySeller[sellerId].push(item);
      }

      // Buat order per seller
      const orders: TOrder[] = [];
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const subtotal = items.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );

        const shippingFee = await calculateShippingFee(sellerId, address);
        const totalPrice = subtotal + shippingFee;

        // 1. Buat order PENDING
        const order = await prisma.order.create({
          data: {
            orderId: generateOrderId(),
            userId: user?.id as string,
            sellerId,
            totalPrice,
            shippingFee,
            address: validated.address,
            status: "PENDING",
            items: {
              create: items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
          },
          include: { items: true },
        });

        // 2. Buat invoice di Xendit
        const invoice = await Invoice.createInvoice({
          data: {
            externalId: order.orderId,
            amount: totalPrice,
            payerEmail: user?.email!,
            description: `Pembayaran Order ${order.orderId}`,
            successRedirectUrl: `${process.env.FRONTEND_URL}/orders/success`,
            failureRedirectUrl: `${process.env.FRONTEND_URL}/orders/failed`,
            currency: "IDR",
            // opsi tambahan:
            // paymentMethods: ['QRIS', 'ID_DANA'], // jika mau batasi metodenya
          },
        });

        // 3. Simpan invoiceId & URL ke DB
        await prisma.order.update({
          where: { id: order.id },
          data: { invoiceId: invoice.id, paymentUrl: invoice.invoiceUrl },
        });

        orders.push({ ...order, paymentUrl: invoice.invoiceUrl });
      }

      // kosongkan cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      res.status(201).json({
        message: "Order created successfully",
        data: orders,
      });
    } catch (error) {
      console.log(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // webhook xendit
  async webhook(req: IReqUser, res: Response) {
    try {
      const { external_id, status } = req.body;

      if (status === "PAID") {
        const order = await prisma.order.update({
          where: { orderId: external_id },
          data: { status: "PAID" },
          include: {
            seller: true,
            items: true,
          },
        });

        // Tambah saldo seller
        await prisma.wallet.update({
          where: { sellerId: order.sellerId },
          data: { balance: { increment: order.totalPrice } },
        });

        // Kurangi stok produk
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      res.status(200).json({ message: "ok" });
    } catch (err) {
      console.log("Webhook error: ", err);
      res.status(500).json({ message: "internal error" });
    }
  },
  // Get All Order
  async index(req: IReqUser, res: Response) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error) {
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // Get Seller Order
  async sellerIndex(req: IReqUser, res: Response) {
    const user = req.user;

    try {
      const seller = await prisma.seller.findFirst({
        where: { userId: user?.id },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not match in our record",
        });
      }

      const orders = await prisma.order.findMany({
        where: {
          sellerId: seller?.id,
        },
        include: {
          items: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error) {
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // Get User Order
  async userIndex(req: IReqUser, res: Response) {
    const user = req.user;

    try {
      const orders = await prisma.order.findMany({
        where: {
          userId: user?.id,
        },
        include: {
          items: true,
          seller: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: orders,
      });
    } catch (error) {
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
