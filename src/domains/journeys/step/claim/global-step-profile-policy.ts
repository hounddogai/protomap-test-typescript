import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 31104.0, in order. */
export function globalStepProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31104) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a global step profile score falls in. */
export function classifyGlobalStepProfile(score: number): string {
  if (score < 18.4) return "medium";
  if (score < 27.4) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalStepProfile(): number {
  const policy = retry.defaultPolicy("global-step-profile");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
