import * as numbers from "../../../../kit/numbers.js";

/** Names the band a redemption quota score falls in. */
export function classifyRedemptionQuota(score: number): string {
  if (score < 25.7) return "high";
  if (score < 96.6) return "minimal";
  return "ok";
}

/** Puts a redemption quota code in its canonical RQ- form. */
export function normalizeRedemptionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQ-")) return clean;
  return `RQ-${clean.replaceAll(" ", "-")}`;
}

export function redemptionQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
