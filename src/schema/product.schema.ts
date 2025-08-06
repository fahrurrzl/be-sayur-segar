import { z } from "zod";
import { Category } from "@prisma/client";

export const productSchema = z.object({
  name: z.string().nonempty({ message: "Please input product name" }),
  description: z.string().nonempty({ message: "Please input description" }),
  price: z.number().nonnegative(),
  stock: z.number().min(1).nonnegative(),
  imageUrl: z.string().nonempty(),
  categoryId: z.string().nonempty({ message: "Please input category" }),
});
