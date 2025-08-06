import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().nonempty({ message: "Please input category name" }),
  imageUrl: z.string().nonempty({ message: "Please input image url" }),
});
