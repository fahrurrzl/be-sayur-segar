import { Response } from "express";
import { IReqUser } from "../types/auth";
import { TPaymentMethod } from "../types/payment-method";
import { prisma } from "../../prisma/prisma";
import { paymentMethodSchema } from "../schema/payment-method.schema";

export default {
  async create(req: IReqUser, res: Response) {
    const { name, type } = req.body as unknown as TPaymentMethod;

    try {
      const validated = paymentMethodSchema.parse({
        name,
        type,
      });

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          name: validated.name,
          type: validated.type,
        },
      });

      res.status(201).json({
        message: "Payment method created successfully",
        data: paymentMethod,
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
      const paymentMethods = await prisma.paymentMethod.findMany();
      res.status(200).json({
        message: "Payment methods fetched successfully",
        data: paymentMethods,
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
      const paymentMethod = await prisma.paymentMethod.findUnique({
        where: {
          id,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({
          message: "Payment method not found",
        });
      }

      res.status(200).json({
        message: "Payment method fetched successfully",
        data: paymentMethod,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async update(req: IReqUser, res: Response) {
    const { id } = req.params;
    const { name, type } = req.body as unknown as TPaymentMethod;

    try {
      const paymentMethod = await prisma.paymentMethod.update({
        where: {
          id,
        },
        data: {
          name,
          type,
        },
      });

      res.status(200).json({
        message: "Payment method updated successfully",
        data: paymentMethod,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
  async destroy(req: IReqUser, res: Response) {
    const { id } = req.params;

    try {
      const paymentMethod = await prisma.paymentMethod.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        message: "Payment method deleted successfully",
        data: paymentMethod,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
};
