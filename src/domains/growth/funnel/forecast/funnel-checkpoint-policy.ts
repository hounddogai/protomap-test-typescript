import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeFunnelCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a funnel checkpoint score falls in. */
export function classifyFunnelCheckpoint(score: number): string {
  if (score < 37.6) return "high";
  if (score < 71.9) return "elevated";
  if (score < 85.1) return "watch";
  if (score < 90.2) return "medium";
  return "critical";
}

/** Counts how many amounts fit in a budget of 3337.0, in order. */
export function funnelCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3337) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
