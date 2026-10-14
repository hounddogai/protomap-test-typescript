import * as numbers from "../../../../kit/numbers.js";

export function optOutDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a opt out draft code in its canonical OOD- form. */
export function normalizeOptOutDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOD-")) return clean;
  return `OOD-${clean.replaceAll(" ", "-")}`;
}

export function optOutDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
