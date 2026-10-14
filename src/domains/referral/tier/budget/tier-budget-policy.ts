import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTierBudget(): number {
  const policy = retry.defaultPolicy("tier-budget");
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

/** Names the band a tier budget score falls in. */
export function classifyTierBudget(score: number): string {
  if (score < 3.3) return "low";
  if (score < 47.3) return "critical";
  return "minimal";
}
