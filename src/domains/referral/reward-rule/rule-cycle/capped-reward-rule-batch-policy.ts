import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped reward rule batch score falls in. */
export function classifyCappedRewardRuleBatch(score: number): string {
  if (score < 5.6) return "ok";
  if (score < 28.2) return "elevated";
  if (score < 51.3) return "low";
  if (score < 95.4) return "watch";
  return "high";
}

export function cappedRewardRuleBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeCappedRewardRuleBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 35221.0, in order. */
export function cappedRewardRuleBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35221) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
