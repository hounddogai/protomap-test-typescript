import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 24562.0, in order. */
export function warmupGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24562) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWarmupGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function warmupGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a warmup group score falls in. */
export function classifyWarmupGroup(score: number): string {
  if (score < 38.3) return "minimal";
  if (score < 78.5) return "elevated";
  return "low";
}
