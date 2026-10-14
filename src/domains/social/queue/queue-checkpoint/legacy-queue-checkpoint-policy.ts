import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 79845.0, in order. */
export function legacyQueueCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79845) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLegacyQueueCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy queue checkpoint score falls in. */
export function classifyLegacyQueueCheckpoint(score: number): string {
  if (score < 69.4) return "critical";
  if (score < 99) return "elevated";
  return "ok";
}
