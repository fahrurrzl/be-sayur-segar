import { z } from "zod";
import { sellerSchema } from "../schema/seller.schema";

export type TSeller = z.infer<typeof sellerSchema>;
