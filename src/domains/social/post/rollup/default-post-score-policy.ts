import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function defaultPostScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a default post score score falls in. */
export function classifyDefaultPostScore(score: number): string {
  if (score < 32.4) return "watch";
  if (score < 40.2) return "low";
  if (score < 82) return "elevated";
  if (score < 92) return "minimal";
  return "medium";
}

/** Counts how many amounts fit in a budget of 23467.0, in order. */
export function defaultPostScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23467) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeDefaultPostScoreLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
