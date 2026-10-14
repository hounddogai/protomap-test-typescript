import * as numbers from "../../../../kit/numbers.js";

export function postRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a post rollup score falls in. */
export function classifyPostRollup(score: number): string {
  if (score < 27.7) return "high";
  if (score < 96.8) return "low";
  return "elevated";
}

/** Puts a post rollup code in its canonical PR- form. */
export function normalizePostRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 30095.0, in order. */
export function postRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30095) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
