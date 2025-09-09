import { z } from "zod";
import { IReqUser } from "../types/auth";
import { Response } from "express";
import { checkoutSchema } from "../schema/order.schema";
import { prisma } from "../../prisma/prisma";
import { TOrder, OrderWithItems } from "../types/order";
import { Invoice } from "../utils/xendit";
import { generateOrderId } from "../utils/randomString";
import { WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import env from "../utils/env";

async function calculateShippingFee(sellerId: string, userAddress: string) {
  return 10000;
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

      // Hitung total seluruh order
      let grandTotal = 0;
      const orders: OrderWithItems[] = [];

      // Buat order PENDING (belum ada invoiceId)
      for (const [sellerId, items] of Object.entries(itemsBySeller)) {
        const subtotal = items.reduce(
          (acc, item) => acc + item.product.price * item.quantity,
          0
        );

        const shippingFee = await calculateShippingFee(sellerId, address);
        const totalPrice = subtotal + shippingFee;
        grandTotal += totalPrice;

        const order = await prisma.order.create({
          data: {
            orderId: generateOrderId("ORD"),
            userId: user?.id as string,
            sellerId,
            totalPrice,
            shippingFee,
            address: validated.address,
            status: "PENDING",
            payment_method: "",
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

        orders.push(order);
      }

      // 1x buat invoice gabungan di Xendit
      const invoice = await Invoice.createInvoice({
        data: {
          externalId: generateOrderId("INV"),
          amount: grandTotal,
          payerEmail: user?.email!,
          description: `Pembayaran ${orders.length} order`,
          successRedirectUrl: `${env.FRONTEND_URL}/order/success`,
          failureRedirectUrl: `${env.FRONTEND_URL}/order/failed`,
          currency: "IDR",
        },
      });

      // Update semua order dengan invoice yang sama
      await prisma.order.updateMany({
        where: { id: { in: orders.map((o) => o.id) } },
        data: {
          invoiceId: invoice.id,
          paymentUrl: invoice.invoiceUrl,
        },
      });

      // kosongkan cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      res.status(201).json({
        message: "Orders created successfully with single invoice",
        data: {
          orders: orders,
          invoiceId: invoice.id,
          paymentUrl: invoice.invoiceUrl,
        },
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
      const { id: invoiceId, status, payment_method } = req.body;

      if (status === "PAID") {
        // 1. Ambil semua order yang pakai invoice ini
        const orders = await prisma.order.findMany({
          where: { invoiceId },
          include: { seller: true, items: true },
        });

        if (orders.length === 0) {
          console.log("No orders found for invoice:", invoiceId);
          return res.status(404).json({ message: "Orders not found" });
        }

        // 2. Update semua order jadi PAID
        await prisma.order.updateMany({
          where: { invoiceId },
          data: { status: "PAID", payment_method },
        });

        // 3. Distribusi saldo per seller
        for (const order of orders) {
          const wallet = await prisma.wallet.update({
            where: { sellerId: order.sellerId },
            data: { balance: { increment: order.totalPrice } },
          });

          // Buat wallet tranaction
          await prisma.walletTransaction.create({
            data: {
              orderId: order.orderId,
              walletId: wallet.id,
              amount: order.totalPrice,
              type: WalletTransactionType.income,
              paymentMethod: payment_method,
              status: WalletTransactionStatus.success,
            },
          });

          // 4. Kurangi stok produk sesuai item di order
          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
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
    const { limit, page, search } = req.query;
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
          ...(search
            ? {
                OR: [
                  {
                    orderId: {
                      contains: search as string,
                      mode: "insensitive",
                    },
                  },
                  {
                    user: {
                      name: {
                        contains: search as string,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        include: {
          items: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await prisma.order.count({
        where: {
          sellerId: seller?.id,
          ...(search
            ? {
                OR: [
                  {
                    orderId: {
                      contains: search as string,
                      mode: "insensitive",
                    },
                  },
                  {
                    user: {
                      name: {
                        contains: search as string,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: {
          orders,
          totalPage: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          total,
        },
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
    const { limit, page, search } = req.query;
    const user = req.user;

    try {
      const orders = await prisma.order.findMany({
        where: {
          userId: user?.id,
          ...(search
            ? {
                OR: [
                  {
                    orderId: {
                      contains: search as string,
                      mode: "insensitive",
                    },
                  },
                  {
                    seller: {
                      storeName: {
                        contains: search as string,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
        include: {
          items: true,
          seller: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const total = await prisma.order.count({
        where: {
          userId: user?.id,
          ...(search
            ? {
                OR: [
                  {
                    orderId: {
                      contains: search as string,
                      mode: "insensitive",
                    },
                  },
                  {
                    user: {
                      name: {
                        contains: search as string,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      });

      res.status(200).json({
        message: "Orders fetched successfully",
        data: {
          orders,
          totalPage: Math.ceil(total / Number(limit)),
          currentPage: Number(page),
          total,
        },
      });
    } catch (error) {
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // Get Order By ID
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          seller: true,
          user: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order fetched successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // Get Order By invoiceId
  async showByInvoiceId(req: IReqUser, res: Response) {
    const user = req.user;
    const { invoiceId } = req.params;
    try {
      const order = await prisma.order.findFirst({
        where: {
          AND: [
            {
              userId: user?.id,
            },
            {
              invoiceId,
            },
          ],
        },
        include: {
          items: true,
          seller: true,
          user: true,
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order fetched successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // is processing
  async isProcess(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const order = await prisma.order.update({
        where: {
          id,
        },
        data: {
          status: "PROCESSING",
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order updated successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // is delivered
  async isDelivered(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const order = await prisma.order.update({
        where: {
          id,
        },
        data: {
          status: "DELIVERED",
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order updated successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  // is completed
  async isCompleted(req: IReqUser, res: Response) {
    const { id } = req.params;
    try {
      const order = await prisma.order.update({
        where: {
          id,
        },
        data: {
          status: "COMPLETED",
        },
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.status(200).json({
        message: "Order updated successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
