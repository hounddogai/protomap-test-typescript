import * as numbers from "../../../../kit/numbers.js";

/** Puts a paywall score code in its canonical PS- form. */
export function normalizePaywallScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PS-")) return clean;
  return `PS-${clean.replaceAll(" ", "-")}`;
}

export function paywallScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
