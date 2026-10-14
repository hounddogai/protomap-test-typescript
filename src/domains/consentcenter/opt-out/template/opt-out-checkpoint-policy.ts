import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 4637.0, in order. */
export function optOutCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4637) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a opt out checkpoint score falls in. */
export function classifyOptOutCheckpoint(score: number): string {
  if (score < 59.2) return "medium";
  if (score < 59.8) return "high";
  if (score < 67.4) return "watch";
  if (score < 94.3) return "critical";
  return "minimal";
}

export function mergeOptOutCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
