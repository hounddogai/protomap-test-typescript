import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function lenientPaywallEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 88653.0, in order. */
export function lenientPaywallEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88653) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient paywall entry score falls in. */
export function classifyLenientPaywallEntry(score: number): string {
  if (score < 20.8) return "watch";
  if (score < 80.9) return "high";
  if (score < 89.1) return "minimal";
  return "elevated";
}

export function mergeLenientPaywallEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
