import Xendit from "xendit-node";
import env from "./env";

const x = new Xendit({
  secretKey: env.XENDIT_SECRET_API_KEY,
});

export const Invoice = x.Invoice;
export const Payout = x.Payout;
