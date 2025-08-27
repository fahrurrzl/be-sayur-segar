import { Response } from "express";
import { IReqUser } from "../types/auth";
import { TSeller } from "../types/seller";
import { z } from "zod";
import { prisma } from "../../prisma/prisma";
import { sellerSchema } from "../schema/seller.schema";

export default {
  async create(req: IReqUser, res: Response) {
    const {
      storeName,
      storeLocation,
      description,
      bankName,
      accountName,
      accountNumber,
    } = req.body as unknown as TSeller;

    try {
      const validated = sellerSchema.parse({
        storeName,
        storeLocation,
        description,
        bankName,
        accountName,
        accountNumber,
      });
      const sellerExists = await prisma.seller.findFirst({
        where: {
          OR: [
            {
              userId: req.user?.id as string,
            },
            {
              storeName: validated.storeName,
            },
          ],
        },
      });
      if (sellerExists) {
        return res.status(400).json({
          message: "Store or seller already exists",
        });
      }

      const seller = await prisma.seller.create({
        data: {
          userId: req.user?.id as string,
          storeName: validated.storeName,
          storeLocation: validated.storeLocation,
          description: validated.description || "",
          bankName: validated.bankName,
          accountName: validated.accountName,
          accountNumber: validated.accountNumber,
        },
      });

      res.status(201).json({
        message: "Store or seller created successfully",
        data: seller,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
          data: null,
        });
      }
    }
  },
  async index(req: IReqUser, res: Response) {
    try {
      const sellers = await prisma.seller.findMany({
        include: {
          products: true,
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.status(200).json({
        message: "Sellers fetched successfully",
        data: sellers,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const seller = await prisma.seller.findUnique({
        where: {
          id,
        },
        include: {
          products: true,
          user: true,
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not found",
        });
      }

      res.status(200).json({
        message: "Seller fetched successfully",
        data: seller,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async me(req: IReqUser, res: Response) {
    const user = req.user;

    try {
      const seller = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
        include: {
          products: {
            include: {
              category: true,
            },
            orderBy: {
              updatedAt: "desc",
            },
          },
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not found",
          data: null,
        });
      }

      res.status(200).json({
        message: "Seller fetched successfully",
        data: seller,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const user = req.user;
    const {
      storeName,
      storeLocation,
      description,
      bankName,
      accountName,
      accountNumber,
    } = req.body as unknown as TSeller;

    try {
      const validated = sellerSchema.parse({
        storeName,
        storeLocation,
        description,
        bankName,
        accountName,
        accountNumber,
      });

      const sellerExists = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!sellerExists) {
        return res.status(404).json({
          message: "Seller not found",
        });
      }

      const seller = await prisma.seller.update({
        where: {
          id: sellerExists.id,
        },
        data: {
          storeName: validated.storeName,
          storeLocation: validated.storeLocation,
          description: validated.description,
          bankName: validated.bankName,
          accountName: validated.accountName,
          accountNumber: validated.accountNumber,
        },
      });

      res.status(200).json({
        message: "Seller updated successfully",
        data: seller,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      } else {
        return res.status(500).json({
          message: "Internal server error",
          data: null,
        });
      }
    }
  },
  async delete(req: IReqUser, res: Response) {
    const user = req.user;
    const deleteConfirmation = req.body as unknown as { storeName: string };

    try {
      const sellerExists = await prisma.seller.findFirst({
        where: {
          userId: user?.id,
        },
      });

      if (!sellerExists) {
        return res.status(404).json({
          message: "Seller not found",
        });
      }

      if (sellerExists.storeName !== deleteConfirmation.storeName) {
        return res.status(400).json({
          message: "Store name does not match",
        });
      }

      const seller = await prisma.seller.delete({
        where: {
          id: sellerExists.id,
        },
      });

      res.status(200).json({
        message: "Seller deleted successfully",
        data: seller,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async adminDeleteSeller(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const seller = await prisma.seller.delete({
        where: {
          id: id,
        },
      });

      res.status(200).json({
        message: "Seller deleted successfully",
        data: seller,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
  async verifySeller(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const seller = await prisma.seller.findUnique({
        where: {
          id: id,
        },
      });

      if (!seller) {
        return res.status(404).json({
          message: "Seller not found",
        });
      }

      const updatedSeller = await prisma.seller.update({
        where: {
          id: id,
        },
        data: {
          verified: true,
        },
      });

      res.status(200).json({
        message: "Seller verified successfully",
        data: updatedSeller,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        data: null,
      });
    }
  },
};
