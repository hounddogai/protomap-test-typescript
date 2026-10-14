import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient reward score code in its canonical LRS- form. */
export function normalizeLenientRewardScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LRS-")) return clean;
  return `LRS-${clean.replaceAll(" ", "-")}`;
}

export function lenientRewardScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 25058.0, in order. */
export function lenientRewardScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25058) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient reward score score falls in. */
export function classifyLenientRewardScore(score: number): string {
  if (score < 56.1) return "minimal";
  if (score < 62.1) return "ok";
  return "elevated";
}
