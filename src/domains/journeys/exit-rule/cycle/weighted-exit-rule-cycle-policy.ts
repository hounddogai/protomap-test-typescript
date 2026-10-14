import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted exit rule cycle code in its canonical WERC- form. */
export function normalizeWeightedExitRuleCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WERC-")) return clean;
  return `WERC-${clean.replaceAll(" ", "-")}`;
}

export function weightedExitRuleCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function weightedExitRuleCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
