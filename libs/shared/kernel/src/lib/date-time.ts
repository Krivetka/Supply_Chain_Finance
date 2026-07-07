declare const dateTimeBrand: unique symbol;

export type DateTime = string & { readonly [dateTimeBrand]: 'DateTime' };

const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function dateTime(value: string): DateTime {
  if (!ISO_8601.test(value)) {
    throw new Error(`DateTime must be ISO 8601, got "${value}"`);
  }
  return value as DateTime;
}

export function isPast(value: DateTime, now: DateTime): boolean {
  return Date.parse(value) < Date.parse(now);
}
