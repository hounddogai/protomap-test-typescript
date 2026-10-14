import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled redemption policy code in its canonical SRP- form. */
export function normalizeScheduledRedemptionPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRP-")) return clean;
  return `SRP-${clean.replaceAll(" ", "-")}`;
}

export function scheduledRedemptionPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
