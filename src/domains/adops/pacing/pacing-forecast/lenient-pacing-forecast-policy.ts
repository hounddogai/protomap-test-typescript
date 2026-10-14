import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient pacing forecast score falls in. */
export function classifyLenientPacingForecast(score: number): string {
  if (score < 4.9) return "watch";
  if (score < 34.6) return "ok";
  if (score < 48.8) return "high";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 74164.0, in order. */
export function lenientPacingForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74164) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientPacingForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientPacingForecast(): number {
  const policy = retry.defaultPolicy("lenient-pacing-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
