import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function rewardRuleTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function rewardRuleTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleTier(): number {
  const policy = retry.defaultPolicy("reward-rule-tier");
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

/** Names the band a reward rule tier score falls in. */
export function classifyRewardRuleTier(score: number): string {
  if (score < 12.9) return "low";
  if (score < 63.5) return "elevated";
  if (score < 82.3) return "medium";
  return "ok";
}
