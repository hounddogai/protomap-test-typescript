import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal paywall review code in its canonical SPR- form. */
export function normalizeSeasonalPaywallReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPR-")) return clean;
  return `SPR-${clean.replaceAll(" ", "-")}`;
}

export function seasonalPaywallReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function seasonalPaywallReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
