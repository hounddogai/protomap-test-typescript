import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a adaptive opt out quota score falls in. */
export function classifyAdaptiveOptOutQuota(score: number): string {
  if (score < 4.6) return "critical";
  if (score < 34.2) return "medium";
  return "high";
}

export function adaptiveOptOutQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveOptOutQuota(): number {
  const policy = retry.defaultPolicy("adaptive-opt-out-quota");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 72413.0, in order. */
export function adaptiveOptOutQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72413) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
