import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function strictQueueMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 54132.0, in order. */
export function strictQueueMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54132) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeStrictQueueMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a strict queue metric score falls in. */
export function classifyStrictQueueMetric(score: number): string {
  if (score < 15.2) return "minimal";
  if (score < 97.9) return "critical";
  return "low";
}
