import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeTieredLeaderboardAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function tieredLeaderboardAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 51577.0, in order. */
export function tieredLeaderboardAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51577) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered leaderboard audit score falls in. */
export function classifyTieredLeaderboardAudit(score: number): string {
  if (score < 36.3) return "critical";
  if (score < 52.5) return "high";
  if (score < 95.9) return "ok";
  return "medium";
}
