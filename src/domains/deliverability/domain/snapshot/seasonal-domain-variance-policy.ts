import * as numbers from "../../../../kit/numbers.js";

export function seasonalDomainVarianceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a seasonal domain variance code in its canonical SDV- form. */
export function normalizeSeasonalDomainVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDV-")) return clean;
  return `SDV-${clean.replaceAll(" ", "-")}`;
}

export function seasonalDomainVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
