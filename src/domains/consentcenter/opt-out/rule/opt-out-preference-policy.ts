import * as retry from "../../../../kit/retry.js";

/** Names the band a opt out preference score falls in. */
export function classifyOptOutPreference(score: number): string {
  if (score < 74.6) return "medium";
  if (score < 98.9) return "critical";
  return "low";
}

/** Counts how many amounts fit in a budget of 30664.0, in order. */
export function optOutPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30664) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeOptOutPreference(): number {
  const policy = retry.defaultPolicy("opt-out-preference");
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
