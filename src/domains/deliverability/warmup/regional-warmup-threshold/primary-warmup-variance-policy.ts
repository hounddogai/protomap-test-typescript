import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 12804.0, in order. */
export function primaryWarmupVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12804) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePrimaryWarmupVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function primaryWarmupVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a primary warmup variance score falls in. */
export function classifyPrimaryWarmupVariance(score: number): string {
  if (score < 85.9) return "watch";
  if (score < 97.9) return "critical";
  return "medium";
}
