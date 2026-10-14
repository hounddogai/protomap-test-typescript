import * as numbers from "../../../../kit/numbers.js";

/** Puts a subscription reservation code in its canonical SR- form. */
export function normalizeSubscriptionReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}

export function subscriptionReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function subscriptionReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
