import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling queue target code in its canonical RQT- form. */
export function normalizeRollingQueueTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RQT-")) return clean;
  return `RQT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 69786.0, in order. */
export function rollingQueueTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69786) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingQueueTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a rolling queue target score falls in. */
export function classifyRollingQueueTarget(score: number): string {
  if (score < 57) return "watch";
  if (score < 75.4) return "elevated";
  return "high";
}
