import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36215.0, in order. */
export function rewardMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36215) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reward mapping code in its canonical RM- form. */
export function normalizeRewardMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RM-")) return clean;
  return `RM-${clean.replaceAll(" ", "-")}`;
}

export function rewardMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
