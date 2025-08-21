import { z } from "zod";
import { orderSchema } from "../schema/order.schema";
import { Prisma } from "@prisma/client";

export type TOrder = z.infer<typeof orderSchema>;

// Type for Prisma order with items
export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true };
}>;
