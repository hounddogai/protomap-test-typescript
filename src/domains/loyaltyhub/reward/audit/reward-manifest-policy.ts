import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardManifest(): number {
  const policy = retry.defaultPolicy("reward-manifest");
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

/** Names the band a reward manifest score falls in. */
export function classifyRewardManifest(score: number): string {
  if (score < 3.3) return "elevated";
  if (score < 84.4) return "watch";
  return "high";
}
