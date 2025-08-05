import { z } from "zod";

export const sellerSchema = z.object({
  bankName: z.string().nonempty({
    message: "Bank name is required",
  }),
  storeName: z.string().min(3, "Store name must be at least 3 characters"),
  storeLocation: z
    .string()
    .min(3, "Store location must be at least 3 characters"),
  bankAccount: z.string().nonempty({
    message: "Bank account is required",
  }),
});
