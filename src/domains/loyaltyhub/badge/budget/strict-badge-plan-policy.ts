import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict badge plan code in its canonical SBP- form. */
export function normalizeStrictBadgePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBP-")) return clean;
  return `SBP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict badge plan score falls in. */
export function classifyStrictBadgePlan(score: number): string {
  if (score < 3.7) return "high";
  if (score < 12.6) return "critical";
  if (score < 79.4) return "minimal";
  return "low";
}

/** Counts how many amounts fit in a budget of 25216.0, in order. */
export function strictBadgePlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25216) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function strictBadgePlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
