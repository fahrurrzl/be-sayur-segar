import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["BANK", "E_WALLET", "COD", "VIRTUAL_ACCOUNT"]),
});

export const sellerPaymentMethodSchema = z.object({
  accountName: z.string().min(3, "Account name must be at least 3 characters"),
  accountNumber: z
    .string()
    .min(3, "Account number must be at least 3 characters"),
});
