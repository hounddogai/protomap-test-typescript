import * as numbers from "../../../../kit/numbers.js";

export function strictBounceQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a strict bounce quota code in its canonical SBQ- form. */
export function normalizeStrictBounceQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBQ-")) return clean;
  return `SBQ-${clean.replaceAll(" ", "-")}`;
}

export function strictBounceQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
