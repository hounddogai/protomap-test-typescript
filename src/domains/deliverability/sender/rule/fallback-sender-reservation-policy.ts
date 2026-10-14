import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 27161.0, in order. */
export function fallbackSenderReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27161) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a fallback sender reservation score falls in. */
export function classifyFallbackSenderReservation(score: number): string {
  if (score < 20.1) return "high";
  if (score < 26.9) return "watch";
  if (score < 59) return "elevated";
  if (score < 62.4) return "medium";
  return "minimal";
}

export function mergeFallbackSenderReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
