import { Response } from "express";
import { IReqUser } from "../types/auth";
import { TUnit } from "../types/unit";
import { unitSchema } from "../schema/unit.schema";
import { prisma } from "../../prisma/prisma";
import { z } from "zod";

export default {
  async create(req: IReqUser, res: Response) {
    const { name, symbol } = req.body as TUnit;

    try {
      const validated = unitSchema.parse({
        name,
        symbol,
      });

      const unitExists = await prisma.unit.findFirst({
        where: {
          name: validated.name,
        },
      });

      if (unitExists) {
        return res.status(400).json({
          message: "Unit already exists",
        });
      }

      const unit = await prisma.unit.create({
        data: {
          name: validated.name,
          symbol: validated.symbol,
        },
      });

      res.status(201).json({
        message: "Unit created successfully",
        data: unit,
      });
    } catch (error) {
      console.log(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      }
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async index(req: IReqUser, res: Response) {
    const { search } = req.query;
    try {
      const units = await prisma.unit.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          ...(search
            ? {
                name: {
                  contains: search as string,
                  mode: "insensitive",
                },
              }
            : {}),
        },
      });
      res.status(200).json({
        message: "Units fetched successfully",
        data: units,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const { name, symbol } = req.body as TUnit;
    const { id } = req.params;

    try {
      const validated = unitSchema.parse({ name, symbol });

      const unitExists = await prisma.unit.findFirst({
        where: {
          name: validated.name,
          NOT: { id },
        },
      });

      if (unitExists) {
        return res.status(400).json({
          message: "Unit name already exists",
        });
      }

      const unit = await prisma.unit.update({
        where: { id },
        data: {
          name: validated.name,
          symbol: validated.symbol,
        },
      });

      res.status(200).json({
        message: "Unit updated successfully",
        data: unit,
      });
    } catch (error) {
      console.log(error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0].message,
        });
      }
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async destroy(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const unit = await prisma.unit.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "Unit deleted successfully",
        data: unit,
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
      const unit = await prisma.unit.findUnique({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "Unit fetched successfully",
        data: unit,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
