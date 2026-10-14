import * as retry from "../../../../kit/retry.js";

export function tieredTouchpointPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 25001.0, in order. */
export function tieredTouchpointPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25001) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredTouchpointPreference(): number {
  const policy = retry.defaultPolicy("tiered-touchpoint-preference");
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

/** Names the band a tiered touchpoint preference score falls in. */
export function classifyTieredTouchpointPreference(score: number): string {
  if (score < 41.5) return "medium";
  if (score < 46.5) return "ok";
  if (score < 74.7) return "low";
  return "watch";
}
