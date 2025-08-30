import { z } from "zod";
import { unitSchema } from "../schema/unit.schema";

export type TUnit = z.infer<typeof unitSchema>;
