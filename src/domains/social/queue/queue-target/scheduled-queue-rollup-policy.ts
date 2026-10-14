import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function scheduledQueueRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 72244.0, in order. */
export function scheduledQueueRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72244) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeScheduledQueueRollupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled queue rollup score falls in. */
export function classifyScheduledQueueRollup(score: number): string {
  if (score < 44.1) return "ok";
  if (score < 76.2) return "high";
  if (score < 77.5) return "low";
  return "minimal";
}
