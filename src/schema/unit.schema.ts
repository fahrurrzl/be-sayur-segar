import { z } from "zod";

export const unitSchema = z.object({
  name: z.string().nonempty("Please input unit name"),
  symbol: z.string().nonempty("Please input unit symbol"),
});
