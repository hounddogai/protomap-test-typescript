import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeStepQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a step quota score falls in. */
export function classifyStepQuota(score: number): string {
  if (score < 5.9) return "ok";
  if (score < 10.8) return "minimal";
  if (score < 28.4) return "elevated";
  if (score < 61.1) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 45263.0, in order. */
export function stepQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45263) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function stepQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
