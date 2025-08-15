import { Response } from "express";
import { IReqUser } from "../types/auth";
import { prisma } from "../../prisma/prisma";

export default {
  create: async (req: IReqUser, res: Response) => {
    const { productId, quantity, price } = req.body;
    const user = req.user;

    try {
      const existingCart = await prisma.cart.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (existingCart) {
        const productInCart = await prisma.cartItem.findFirst({
          where: {
            AND: [
              {
                cartId: existingCart.id,
              },
              {
                productId,
              },
            ],
          },
        });

        if (productInCart) {
          const result = await prisma.cartItem.update({
            where: {
              id: productInCart.id,
            },
            data: {
              quantity: productInCart.quantity + quantity,
              price: price * (productInCart.quantity + quantity),
            },
          });

          return res.status(200).json({
            message: "Product updated in cart successfully",
            data: result,
          });
        }
      }

      const result = await prisma.cartItem.create({
        data: {
          cartId: existingCart?.id as string,
          productId,
          quantity,
          price,
        },
      });

      return res.status(201).json({
        message: "Product added to cart successfully",
        data: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  index: async (req: IReqUser, res: Response) => {
    const user = req.user;

    try {
      const cart = await prisma.cart.findFirst({
        where: {
          userId: user?.id,
        },
        include: {
          items: true,
        },
      });

      if (!cart) {
        return res.status(404).json({
          message: "You don't have any items in your cart",
          data: [],
        });
      }

      return res.status(200).json({
        message: "Cart fetched successfully",
        data: cart,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  destroy: async (req: IReqUser, res: Response) => {
    const { id } = req.body;
    const user = req.user;

    try {
      const cart = await prisma.cart.findFirst({
        where: {
          userId: user?.id,
        },
        include: {
          items: true,
        },
      });

      if (!cart?.items.length) {
        await prisma.cart.delete({
          where: {
            id: cart?.id,
          },
        });
      }

      const cartItem = await prisma.cartItem.delete({
        where: {
          id,
        },
      });

      return res.status(200).json({
        message: "Product removed from cart successfully",
        data: cartItem,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
