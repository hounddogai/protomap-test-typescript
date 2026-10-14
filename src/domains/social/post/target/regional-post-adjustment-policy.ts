import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional post adjustment code in its canonical RPA- form. */
export function normalizeRegionalPostAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPA-")) return clean;
  return `RPA-${clean.replaceAll(" ", "-")}`;
}

export function regionalPostAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalPostAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a regional post adjustment score falls in. */
export function classifyRegionalPostAdjustment(score: number): string {
  if (score < 6.3) return "high";
  if (score < 23.5) return "medium";
  if (score < 33.6) return "watch";
  return "critical";
}
