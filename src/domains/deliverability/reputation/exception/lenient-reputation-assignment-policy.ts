import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientReputationAssignment(): number {
  const policy = retry.defaultPolicy("lenient-reputation-assignment");
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

/** Names the band a lenient reputation assignment score falls in. */
export function classifyLenientReputationAssignment(score: number): string {
  if (score < 23.3) return "low";
  if (score < 63.7) return "ok";
  return "watch";
}
