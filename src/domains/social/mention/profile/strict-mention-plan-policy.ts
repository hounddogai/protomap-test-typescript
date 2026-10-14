import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 31385.0, in order. */
export function strictMentionPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31385) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict mention plan score falls in. */
export function classifyStrictMentionPlan(score: number): string {
  if (score < 21.8) return "minimal";
  if (score < 31.9) return "low";
  return "high";
}

export function strictMentionPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeStrictMentionPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
