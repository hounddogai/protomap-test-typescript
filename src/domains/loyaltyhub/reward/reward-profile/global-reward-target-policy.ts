import * as numbers from "../../../../kit/numbers.js";

export function globalRewardTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function globalRewardTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a global reward target code in its canonical GRT- form. */
export function normalizeGlobalRewardTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRT-")) return clean;
  return `GRT-${clean.replaceAll(" ", "-")}`;
}

export function globalRewardTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
