import * as numbers from "../../../../kit/numbers.js";

export function macroPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a macro preference score falls in. */
export function classifyMacroPreference(score: number): string {
  if (score < 5.2) return "ok";
  if (score < 24.8) return "low";
  if (score < 50.8) return "medium";
  return "watch";
}

/** Counts how many amounts fit in a budget of 87244.0, in order. */
export function macroPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87244) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function macroPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
