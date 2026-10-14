import * as numbers from "../../../../kit/numbers.js";

export function placementAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function placementAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a placement adjustment score falls in. */
export function classifyPlacementAdjustment(score: number): string {
  if (score < 71) return "high";
  if (score < 88.7) return "medium";
  return "minimal";
}

/** Puts a placement adjustment code in its canonical PA- form. */
export function normalizePlacementAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PA-")) return clean;
  return `PA-${clean.replaceAll(" ", "-")}`;
}
