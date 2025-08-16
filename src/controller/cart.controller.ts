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
        } else {
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
        }
      }

      const cart = await prisma.cart.create({
        data: {
          userId: user?.id as string,
        },
      });

      const result = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
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
          _count: {
            select: { items: true },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  stock: true,
                  imageUrl: true,
                  seller: {
                    select: {
                      storeName: true,
                      storeLocation: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

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
    const { itemId } = req.body;
    const user = req.user;

    try {
      // 1️⃣ Ambil item + cart-nya untuk cek kepemilikan
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.userId !== user?.id) {
        return res.status(404).json({
          message: "Item not found in your cart",
        });
      }

      // 2️⃣ Hapus item
      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      // 3️⃣ Cek apakah cart masih punya item
      const remainingItems = await prisma.cartItem.count({
        where: { cartId: cartItem?.cartId },
      });

      // 4️⃣ Kalau kosong → hapus cart
      if (remainingItems === 0) {
        await prisma.cart.delete({
          where: { id: cartItem?.cartId },
        });
      }

      res.status(200).json({
        message: "Product removed from cart successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  increase: async (req: IReqUser, res: Response) => {
    const user = req.user;
    const { itemId } = req.body;

    try {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true, product: true },
      });

      if (!cartItem || cartItem.cart.userId !== user?.id) {
        return res.status(404).json({
          message: "Item not found in your cart",
        });
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: cartItem.quantity + 1,
          price: cartItem.product.price * (cartItem.quantity + 1),
        },
      });

      res.status(200).json({
        message: "Product quantity increased successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  decrease: async (req: IReqUser, res: Response) => {
    const userId = req.user?.id;
    const { itemId } = req.body;

    try {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
        include: { cart: true, product: true },
      });

      // Validasi kepemilikan item
      if (!cartItem || cartItem.cart.userId !== userId) {
        return res.status(404).json({ message: "Item not found in your cart" });
      }

      // Kalau quantity tinggal 1 → hapus item
      if (cartItem.quantity <= 1) {
        await prisma.cartItem.delete({ where: { id: itemId } });
        return res
          .status(200)
          .json({ message: "Product removed from cart successfully" });
      }

      // Kalau quantity > 1 → kurangi quantity & update harga
      const updatedQuantity = cartItem.quantity - 1;
      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity: updatedQuantity,
          price: cartItem.product.price * updatedQuantity,
        },
      });

      return res
        .status(200)
        .json({ message: "Product quantity decreased successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
