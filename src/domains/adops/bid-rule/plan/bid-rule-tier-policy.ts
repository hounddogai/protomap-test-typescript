import * as numbers from "../../../../kit/numbers.js";

export function bidRuleTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function bidRuleTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a bid rule tier score falls in. */
export function classifyBidRuleTier(score: number): string {
  if (score < 26.1) return "elevated";
  if (score < 39.5) return "watch";
  return "medium";
}

/** Puts a bid rule tier code in its canonical BRT- form. */
export function normalizeBidRuleTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRT-")) return clean;
  return `BRT-${clean.replaceAll(" ", "-")}`;
}
