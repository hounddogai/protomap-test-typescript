import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyCsatQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy csat quota score falls in. */
export function classifyLegacyCsatQuota(score: number): string {
  if (score < 55.2) return "high";
  if (score < 56.4) return "watch";
  if (score < 69) return "medium";
  if (score < 72.5) return "minimal";
  return "critical";
}

/** Counts how many amounts fit in a budget of 21073.0, in order. */
export function legacyCsatQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21073) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function legacyCsatQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
