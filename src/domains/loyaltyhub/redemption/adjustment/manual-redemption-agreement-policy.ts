import * as numbers from "../../../../kit/numbers.js";

export function manualRedemptionAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a manual redemption agreement score falls in. */
export function classifyManualRedemptionAgreement(score: number): string {
  if (score < 90) return "elevated";
  if (score < 99.3) return "watch";
  return "low";
}

/** Puts a manual redemption agreement code in its canonical MRA- form. */
export function normalizeManualRedemptionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRA-")) return clean;
  return `MRA-${clean.replaceAll(" ", "-")}`;
}
