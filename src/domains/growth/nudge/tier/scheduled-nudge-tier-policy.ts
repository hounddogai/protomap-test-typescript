import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled nudge tier score falls in. */
export function classifyScheduledNudgeTier(score: number): string {
  if (score < 27.7) return "minimal";
  if (score < 78.4) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 69775.0, in order. */
export function scheduledNudgeTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69775) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledNudgeTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeScheduledNudgeTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
