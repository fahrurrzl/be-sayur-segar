import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().nonempty({ message: "Product ID is required" }),
  quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
  price: z.number().min(0, { message: "Price must be >= 0" }),
});

export const orderSchema = z.object({
  userId: z.string().nonempty({ message: "User ID is required" }),
  sellerId: z.string().nonempty({ message: "Seller ID is required" }),
  address: z.string().nonempty({ message: "Address is required" }),
  shippingFee: z.number().min(0, { message: "Shipping fee must be >= 0" }),
  totalPrice: z.number().min(0, { message: "Total price must be >= 0" }),
  status: z
    .enum(["PENDING", "PAID", "FAILED", "PROCESSING", "DELIVERED", "COMPLETED"])
    .default("PENDING"),
  items: z
    .array(orderItemSchema)
    .nonempty({ message: "Order must have at least 1 item" }),
  paymentUrl: z.string().nullable().optional(),
});

// khusus checkout (user kirim address dan sellerPaymentMethodId)
export const checkoutSchema = z.object({
  address: z.string().nonempty({ message: "Address is required" }),
});
