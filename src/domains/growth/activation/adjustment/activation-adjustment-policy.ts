import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationAdjustment(): number {
  const policy = retry.defaultPolicy("activation-adjustment");
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

/** Names the band a activation adjustment score falls in. */
export function classifyActivationAdjustment(score: number): string {
  if (score < 37.8) return "low";
  if (score < 50.1) return "medium";
  if (score < 66.2) return "ok";
  if (score < 82.2) return "minimal";
  return "high";
}
