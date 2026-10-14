import * as numbers from "../../../../kit/numbers.js";

export function lenientRedemptionTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a lenient redemption tier code in its canonical LRT- form. */
export function normalizeLenientRedemptionTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRT-")) return clean;
  return `LRT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a lenient redemption tier score falls in. */
export function classifyLenientRedemptionTier(score: number): string {
  if (score < 26.1) return "minimal";
  if (score < 54.9) return "medium";
  if (score < 64.2) return "ok";
  return "critical";
}

export function lenientRedemptionTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
