import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling nudge snapshot score falls in. */
export function classifyRollingNudgeSnapshot(score: number): string {
  if (score < 31.8) return "elevated";
  if (score < 41.1) return "medium";
  if (score < 53.6) return "low";
  if (score < 63.9) return "watch";
  return "high";
}

export function rollingNudgeSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRollingNudgeSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 78561.0, in order. */
export function rollingNudgeSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78561) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
