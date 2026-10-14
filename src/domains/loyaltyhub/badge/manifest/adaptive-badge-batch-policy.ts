import * as numbers from "../../../../kit/numbers.js";

export function adaptiveBadgeBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a adaptive badge batch code in its canonical ABB- form. */
export function normalizeAdaptiveBadgeBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ABB-")) return clean;
  return `ABB-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveBadgeBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
