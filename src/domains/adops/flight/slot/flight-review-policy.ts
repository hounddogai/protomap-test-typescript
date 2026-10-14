import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 50337.0, in order. */
export function flightReviewBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50337) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a flight review code in its canonical FR- form. */
export function normalizeFlightReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FR-")) return clean;
  return `FR-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a flight review score falls in. */
export function classifyFlightReview(score: number): string {
  if (score < 8.8) return "minimal";
  if (score < 38.5) return "low";
  if (score < 70.8) return "medium";
  return "elevated";
}

export function flightReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
