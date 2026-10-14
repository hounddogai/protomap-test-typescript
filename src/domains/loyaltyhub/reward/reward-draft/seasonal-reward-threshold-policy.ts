import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalRewardThreshold(): number {
  const policy = retry.defaultPolicy("seasonal-reward-threshold");
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

/** Names the band a seasonal reward threshold score falls in. */
export function classifySeasonalRewardThreshold(score: number): string {
  if (score < 5.4) return "medium";
  if (score < 23.1) return "elevated";
  if (score < 41.5) return "ok";
  if (score < 46.8) return "high";
  return "low";
}
