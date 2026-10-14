import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function tieredTierBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a tiered tier baseline score falls in. */
export function classifyTieredTierBaseline(score: number): string {
  if (score < 58.3) return "minimal";
  if (score < 72.2) return "medium";
  if (score < 99.1) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 98493.0, in order. */
export function tieredTierBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98493) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeTieredTierBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
