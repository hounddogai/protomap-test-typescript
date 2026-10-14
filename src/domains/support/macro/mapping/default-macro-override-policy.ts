import * as numbers from "../../../../kit/numbers.js";

export function defaultMacroOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 5124.0, in order. */
export function defaultMacroOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5124) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default macro override score falls in. */
export function classifyDefaultMacroOverride(score: number): string {
  if (score < 35.2) return "ok";
  if (score < 43.5) return "elevated";
  return "critical";
}

export function defaultMacroOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
