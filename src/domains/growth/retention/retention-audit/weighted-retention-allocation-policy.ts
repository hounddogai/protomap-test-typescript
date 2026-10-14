import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted retention allocation code in its canonical WRA- form. */
export function normalizeWeightedRetentionAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRA-")) return clean;
  return `WRA-${clean.replaceAll(" ", "-")}`;
}

export function weightedRetentionAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted retention allocation score falls in. */
export function classifyWeightedRetentionAllocation(score: number): string {
  if (score < 9) return "minimal";
  if (score < 18.1) return "elevated";
  return "ok";
}
