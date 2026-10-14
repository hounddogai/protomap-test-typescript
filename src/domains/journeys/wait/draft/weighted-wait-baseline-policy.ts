import * as numbers from "../../../../kit/numbers.js";

export function weightedWaitBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function weightedWaitBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a weighted wait baseline code in its canonical WWB- form. */
export function normalizeWeightedWaitBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WWB-")) return clean;
  return `WWB-${clean.replaceAll(" ", "-")}`;
}
