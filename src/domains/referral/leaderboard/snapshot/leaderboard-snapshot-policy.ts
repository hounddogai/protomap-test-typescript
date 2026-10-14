import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a leaderboard snapshot score falls in. */
export function classifyLeaderboardSnapshot(score: number): string {
  if (score < 1.6) return "watch";
  if (score < 38.7) return "low";
  if (score < 45.2) return "minimal";
  return "ok";
}

export function leaderboardSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 87502.0, in order. */
export function leaderboardSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87502) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLeaderboardSnapshotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
