import * as retry from "../../../../kit/retry.js";

/** Names the band a proof adjustment score falls in. */
export function classifyProofAdjustment(score: number): string {
  if (score < 11.6) return "high";
  if (score < 19.3) return "medium";
  if (score < 70.9) return "minimal";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeProofAdjustment(): number {
  const policy = retry.defaultPolicy("proof-adjustment");
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
