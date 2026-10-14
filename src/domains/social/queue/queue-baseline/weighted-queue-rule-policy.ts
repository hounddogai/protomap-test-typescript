import * as numbers from "../../../../kit/numbers.js";

export function weightedQueueRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a weighted queue rule code in its canonical WQR- form. */
export function normalizeWeightedQueueRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WQR-")) return clean;
  return `WQR-${clean.replaceAll(" ", "-")}`;
}
