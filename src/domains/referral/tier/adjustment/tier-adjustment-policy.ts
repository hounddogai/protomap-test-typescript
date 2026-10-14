import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTierAdjustment(): number {
  const policy = retry.defaultPolicy("tier-adjustment");
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

/** Names the band a tier adjustment score falls in. */
export function classifyTierAdjustment(score: number): string {
  if (score < 17.4) return "low";
  if (score < 59.9) return "minimal";
  if (score < 66) return "critical";
  if (score < 99.6) return "medium";
  return "ok";
}
