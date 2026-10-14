import * as retry from "../../../../kit/retry.js";

export function flightEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 8405.0, in order. */
export function flightEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8405) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFlightEntry(): number {
  const policy = retry.defaultPolicy("flight-entry");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a flight entry score falls in. */
export function classifyFlightEntry(score: number): string {
  if (score < 16.7) return "elevated";
  if (score < 32.9) return "low";
  if (score < 44) return "watch";
  return "high";
}
