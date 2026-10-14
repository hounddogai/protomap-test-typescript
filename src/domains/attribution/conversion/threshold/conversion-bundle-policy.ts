import * as numbers from "../../../../kit/numbers.js";

export function conversionBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a conversion bundle score falls in. */
export function classifyConversionBundle(score: number): string {
  if (score < 27.7) return "critical";
  if (score < 46) return "minimal";
  if (score < 58.5) return "watch";
  if (score < 90.6) return "low";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 99349.0, in order. */
export function conversionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99349) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function conversionBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}
