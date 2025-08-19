import { z } from "zod";
import { orderSchema } from "../schema/order.schema";

export type TOrder = z.infer<typeof orderSchema>;
