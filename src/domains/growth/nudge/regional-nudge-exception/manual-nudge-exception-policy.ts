import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 56159.0, in order. */
export function manualNudgeExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56159) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a manual nudge exception score falls in. */
export function classifyManualNudgeException(score: number): string {
  if (score < 7.1) return "high";
  if (score < 12.9) return "ok";
  return "watch";
}

export function manualNudgeExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
