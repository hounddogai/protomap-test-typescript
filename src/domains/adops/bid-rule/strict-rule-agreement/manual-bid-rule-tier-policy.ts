import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function manualBidRuleTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.9;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 43605.0, in order. */
export function manualBidRuleTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43605) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual bid rule tier score falls in. */
export function classifyManualBidRuleTier(score: number): string {
  if (score < 13.5) return "low";
  if (score < 18.2) return "watch";
  if (score < 64.9) return "elevated";
  if (score < 77.1) return "medium";
  return "ok";
}

export function mergeManualBidRuleTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
