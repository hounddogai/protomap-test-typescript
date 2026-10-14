import * as numbers from "../../../../kit/numbers.js";

export function subscriptionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a subscription bundle code in its canonical SB- form. */
export function normalizeSubscriptionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SB-")) return clean;
  return `SB-${clean.replaceAll(" ", "-")}`;
}
