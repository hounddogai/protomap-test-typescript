import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaVariance(): number {
  const policy = retry.defaultPolicy("sla-variance");
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

/** Names the band a sla variance score falls in. */
export function classifySlaVariance(score: number): string {
  if (score < 2.9) return "watch";
  if (score < 57.3) return "critical";
  if (score < 80.4) return "minimal";
  if (score < 89) return "ok";
  return "high";
}
