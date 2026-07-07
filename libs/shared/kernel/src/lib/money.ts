import type { Currency } from './currency';

declare const moneyBrand: unique symbol;

export type Money = number & { readonly [moneyBrand]: 'Money' };

export function money(minorUnits: number): Money {
  if (!Number.isInteger(minorUnits)) {
    throw new Error(`Money must be an integer number of minor units, got ${minorUnits}`);
  }
  if (minorUnits < 0) {
    throw new Error(`Money cannot be negative, got ${minorUnits}`);
  }
  return minorUnits as Money;
}

export function addMoney(a: Money, b: Money): Money {
  return money(a + b);
}

export function subtractMoney(a: Money, b: Money): Money {
  return money(a - b);
}

export function formatMoney(amount: Money, code: Currency): string {
  const major = (amount / 100).toFixed(2);
  return `${major} ${code}`;
}
