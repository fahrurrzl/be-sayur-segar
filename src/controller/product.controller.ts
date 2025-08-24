import { Response } from "express";
import { prisma } from "../../prisma/prisma";
import { productSchema } from "../schema/product.schema";
import { IReqUser } from "../types/auth";
import { TProduct } from "../types/product";
import { z } from "zod";

export default {
  async create(req: IReqUser, res: Response) {
    const user = req.user;
    const { name, description, price, stock, imageUrl, categoryId } =
      req.body as unknown as TProduct;

    try {
      const validated = productSchema.parse({
        name,
        description,
        price,
        stock,
        imageUrl,
        categoryId,
      });

      const seller = await prisma.seller.findFirst({
        where: {
          AND: [
            {
              userId: user?.id,
            },
            {
              verified: true,
            },
          ],
        },
      });

      if (!seller) {
        return res.status(404).json({
          message:
            "Seller not match in our record or make sure you are verified",
        });
      }

      const product = await prisma.product.create({
        data: {
          sellerId: seller?.id,
          name: validated.name,
          description: validated.description,
          price: Number(validated.price),
          stock: validated.stock,
          imageUrl: validated.imageUrl,
          categoryId: validated.categoryId,
        },
      });

      res.status(201).json({
        message: "Product created successfully",
        data: {
          ...product,
          price: Number(product.price),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      }

      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async index(req: IReqUser, res: Response) {
    const { search, category } = req.query;
    try {
      const products = await prisma.product.findMany({
        where: {
          ...(search
            ? {
                name: {
                  contains: search as string,
                  mode: "insensitive",
                },
              }
            : {}),
          ...(category ? { categoryId: category as string } : {}),
        },
        include: {
          seller: {
            select: {
              storeName: true,
              storeLocation: true,
            },
          },
        },
      });

     

      res.status(200).json({
        message: "Products fetched successfully",
        data: products,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const product = await prisma.product.findUnique({
        where: {
          id,
        },
        include: {
          seller: {
            select: {
              storeName: true,
              storeLocation: true,
              userId: true,
            },
          },
        },
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not match in our record",
        });
      }

      res.status(200).json({
        message: "Product fetched successfully",
        data: {
          ...product,
          price: Number(product.price),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const user = req.user;
    const { id } = req.params;
    const { name, description, price, stock, imageUrl, categoryId } =
      req.body as unknown as TProduct;

    try {
      const validated = productSchema.parse({
        name,
        description,
        price,
        stock,
        imageUrl,
        categoryId,
      });

      const seller = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not match in our record",
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id,
        },
        include: {
          seller: {},
        },
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not match in our record",
        });
      }

      if (product.sellerId !== seller?.id) {
        return res.status(403).json({
          message: "You are not authorized to update this product",
        });
      }

      const updatedProduct = await prisma.product.update({
        where: {
          id,
        },
        data: {
          name: validated.name,
          description: validated.description,
          price: Number(validated.price),
          stock: validated.stock,
          imageUrl: validated.imageUrl,
          categoryId: validated.categoryId,
        },
      });

      res.status(200).json({
        message: "Product updated successfully",
        data: {
          ...updatedProduct,
          price: Number(updatedProduct.price),
        },
      });
    } catch (error) {
      console.log("error => ", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      }
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async delete(req: IReqUser, res: Response) {
    const user = req.user;
    const { id } = req.params;

    try {
      const seller = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not match in our record",
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id,
        },
      });

      if (product?.sellerId !== seller?.id) {
        return res.status(403).json({
          message: "You are not authorized to delete this product",
        });
      }

      if (!product) {
        return res.status(404).json({
          message: "Product not match in our record",
        });
      }

      const deletedProduct = await prisma.product.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "Product deleted successfully",
        data: {
          ...deletedProduct,
          price: Number(deletedProduct.price),
        },
      });
    } catch (error) {
      console.log("error => ", error);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
