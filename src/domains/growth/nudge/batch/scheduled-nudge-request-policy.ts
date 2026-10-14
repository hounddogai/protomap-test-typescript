import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function scheduledNudgeRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeScheduledNudgeRequestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled nudge request score falls in. */
export function classifyScheduledNudgeRequest(score: number): string {
  if (score < 38.7) return "low";
  if (score < 97.3) return "high";
  return "critical";
}

/** Counts how many amounts fit in a budget of 1612.0, in order. */
export function scheduledNudgeRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1612) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
