export type Currency = 'USD' | 'EUR' | 'GBP';

const CURRENCIES: ReadonlySet<Currency> = new Set(['USD', 'EUR', 'GBP']);

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as ReadonlySet<string>).has(value);
}

export function currency(value: string): Currency {
  if (!isCurrency(value)) {
    throw new Error(`Unsupported currency: ${value}`);
  }
  return value;
}
