import * as retry from "../../../../kit/retry.js";

/** Names the band a tier profile score falls in. */
export function classifyTierProfile(score: number): string {
  if (score < 20.7) return "watch";
  if (score < 87.9) return "minimal";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTierProfile(): number {
  const policy = retry.defaultPolicy("tier-profile");
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
