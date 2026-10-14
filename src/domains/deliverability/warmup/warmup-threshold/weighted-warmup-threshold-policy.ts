import * as numbers from "../../../../kit/numbers.js";

export function weightedWarmupThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Puts a weighted warmup threshold code in its canonical WWT- form. */
export function normalizeWeightedWarmupThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WWT-")) return clean;
  return `WWT-${clean.replaceAll(" ", "-")}`;
}

export function weightedWarmupThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
