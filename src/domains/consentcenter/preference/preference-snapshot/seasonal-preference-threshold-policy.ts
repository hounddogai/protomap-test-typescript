import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal preference threshold code in its canonical SPT- form. */
export function normalizeSeasonalPreferenceThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPT-")) return clean;
  return `SPT-${clean.replaceAll(" ", "-")}`;
}

export function seasonalPreferenceThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 83035.0, in order. */
export function seasonalPreferenceThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83035) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal preference threshold score falls in. */
export function classifySeasonalPreferenceThreshold(score: number): string {
  if (score < 20.3) return "watch";
  if (score < 75.9) return "critical";
  if (score < 97.8) return "minimal";
  return "elevated";
}
