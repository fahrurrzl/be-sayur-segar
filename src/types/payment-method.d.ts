export type TPaymentMethod = {
  name: string;
  type: "BANK" | "E_WALLET" | "COD" | "VIRTUAL_ACCOUNT";
};

export type TSellerPaymentMethod = {
  accountName?: string;
  accountNumber?: string;
};
