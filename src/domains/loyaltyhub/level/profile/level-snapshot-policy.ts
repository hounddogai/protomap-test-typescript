import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 62020.0, in order. */
export function levelSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62020) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a level snapshot score falls in. */
export function classifyLevelSnapshot(score: number): string {
  if (score < 39.1) return "watch";
  if (score < 54.4) return "minimal";
  if (score < 83.6) return "elevated";
  return "medium";
}

export function mergeLevelSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
