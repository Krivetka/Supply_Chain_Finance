declare const supplierIdBrand: unique symbol;
declare const invoiceIdBrand: unique symbol;
declare const userIdBrand: unique symbol;

export type SupplierId = string & { readonly [supplierIdBrand]: 'SupplierId' };
export type InvoiceId = string & { readonly [invoiceIdBrand]: 'InvoiceId' };
export type UserId = string & { readonly [userIdBrand]: 'UserId' };

function nonEmpty(value: string, kind: string): string {
  if (value.length === 0) {
    throw new Error(`${kind} cannot be empty`);
  }
  return value;
}

export function supplierId(value: string): SupplierId {
  return nonEmpty(value, 'SupplierId') as SupplierId;
}

export function invoiceId(value: string): InvoiceId {
  return nonEmpty(value, 'InvoiceId') as InvoiceId;
}

export function userId(value: string): UserId {
  return nonEmpty(value, 'UserId') as UserId;
}
