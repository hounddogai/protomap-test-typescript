import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingJourneyBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function rollingJourneyBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling journey baseline score falls in. */
export function classifyRollingJourneyBaseline(score: number): string {
  if (score < 31.5) return "elevated";
  if (score < 62) return "minimal";
  if (score < 74.7) return "critical";
  if (score < 95.7) return "high";
  return "medium";
}

/** Counts how many amounts fit in a budget of 75637.0, in order. */
export function rollingJourneyBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 75637) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
