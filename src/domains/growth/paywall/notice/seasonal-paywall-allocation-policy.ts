import * as numbers from "../../../../kit/numbers.js";

export function seasonalPaywallAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a seasonal paywall allocation code in its canonical SPA- form. */
export function normalizeSeasonalPaywallAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPA-")) return clean;
  return `SPA-${clean.replaceAll(" ", "-")}`;
}
