import * as numbers from "../../../../kit/numbers.js";

export function seasonalDomainAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function seasonalDomainAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a seasonal domain audit code in its canonical SDA- form. */
export function normalizeSeasonalDomainAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDA-")) return clean;
  return `SDA-${clean.replaceAll(" ", "-")}`;
}
