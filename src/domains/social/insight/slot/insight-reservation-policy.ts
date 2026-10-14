import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function insightReservationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeInsightReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 84329.0, in order. */
export function insightReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84329) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a insight reservation score falls in. */
export function classifyInsightReservation(score: number): string {
  if (score < 2.1) return "high";
  if (score < 9.2) return "minimal";
  if (score < 48) return "elevated";
  if (score < 64.2) return "ok";
  return "low";
}
