import * as numbers from "../../../../kit/numbers.js";

export function defaultPacingTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 79901.0, in order. */
export function defaultPacingTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79901) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default pacing target score falls in. */
export function classifyDefaultPacingTarget(score: number): string {
  if (score < 31.2) return "low";
  if (score < 48.4) return "ok";
  if (score < 68.8) return "elevated";
  return "minimal";
}

export function defaultPacingTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
