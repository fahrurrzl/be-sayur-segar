import { z } from "zod";
import { productSchema } from "../schema/product.schema";

export type TProduct = z.infer<typeof productSchema>;
