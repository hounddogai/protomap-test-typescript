import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending subscription threshold code in its canonical PST- form. */
export function normalizePendingSubscriptionThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PST-")) return clean;
  return `PST-${clean.replaceAll(" ", "-")}`;
}

export function pendingSubscriptionThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
