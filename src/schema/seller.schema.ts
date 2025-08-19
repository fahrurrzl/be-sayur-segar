import { z } from "zod";

export const sellerSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  description: z.string().optional(),
  storeLocation: z
    .string()
    .min(3, "Store location must be at least 3 characters"),
});
