import { Response } from "express";
import { IReqUser } from "../types/auth";
import { TCategory } from "../types/category";
import { categorySchema } from "../schema/category.schema";
import { prisma } from "../../prisma/prisma";

export default {
  async create(req: IReqUser, res: Response) {
    const user = req.user;
    const { name, imageUrl } = req.body as TCategory;

    try {
      const validated = categorySchema.parse({
        name,
        imageUrl,
      });

      const isSuperAdmin = user?.role === "superadmin";

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: "You are not authorized to create category",
        });
      }

      const category = await prisma.category.create({
        data: {
          name: validated.name,
          imageUrl: validated.imageUrl,
          createdBy: user?.id,
        },
      });

      res.status(201).json({
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async index(req: IReqUser, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          products: true,
          user: true,
        },
      });

      res.status(200).json({
        message: "Categories fetched successfully",
        data: categories,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async show(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const category = await prisma.category.findUnique({
        where: {
          id,
        },
        include: {
          products: true,
          user: true,
        },
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      res.status(200).json({
        message: "Category fetched successfully",
        data: category,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const user = req.user;
    const { id } = req.params;
    const { name, imageUrl } = req.body as TCategory;

    try {
      const isSuperAdmin = user?.role === "superadmin";

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: "You are not authorized to update category",
        });
      }

      const category = await prisma.category.findUnique({
        where: {
          id,
        },
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      const validated = categorySchema.parse({
        name,
        imageUrl,
      });

      const updatedCategory = await prisma.category.update({
        where: {
          id,
        },
        data: {
          name: validated.name,
          imageUrl: validated.imageUrl,
        },
      });

      res.status(200).json({
        message: "Category updated successfully",
        data: updatedCategory,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async delete(req: IReqUser, res: Response) {
    const user = req.user;
    const { id } = req.params;

    try {
      const isSuperAdmin = user?.role === "superadmin";

      if (!isSuperAdmin) {
        return res.status(403).json({
          message: "You are not authorized to delete category",
        });
      }

      const category = await prisma.category.findUnique({
        where: {
          id,
        },
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      const result = await prisma.category.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "Category deleted successfully",
        data: result,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
