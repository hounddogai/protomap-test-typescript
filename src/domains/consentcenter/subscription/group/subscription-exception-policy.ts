import * as numbers from "../../../../kit/numbers.js";

/** Puts a subscription exception code in its canonical SE- form. */
export function normalizeSubscriptionExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SE-")) return clean;
  return `SE-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
