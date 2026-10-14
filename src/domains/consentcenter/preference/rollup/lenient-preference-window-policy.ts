import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a lenient preference window score falls in. */
export function classifyLenientPreferenceWindow(score: number): string {
  if (score < 50.7) return "watch";
  if (score < 63.4) return "medium";
  if (score < 95.7) return "critical";
  return "high";
}

/** Counts how many amounts fit in a budget of 55003.0, in order. */
export function lenientPreferenceWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55003) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLenientPreferenceWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function lenientPreferenceWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
