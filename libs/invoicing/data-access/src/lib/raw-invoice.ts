export interface RawFinancingOffer {
  discountRate: number;
  netAmount: number;
  expiresAt: string;
}

export interface RawInvoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  buyerName: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  financingOffer?: RawFinancingOffer | null;
}
