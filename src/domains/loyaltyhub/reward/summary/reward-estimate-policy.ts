import * as numbers from "../../../../kit/numbers.js";

export function rewardEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 74529.0, in order. */
export function rewardEstimateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74529) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reward estimate code in its canonical RE- form. */
export function normalizeRewardEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RE-")) return clean;
  return `RE-${clean.replaceAll(" ", "-")}`;
}
