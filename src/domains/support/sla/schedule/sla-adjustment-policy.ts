import * as retry from "../../../../kit/retry.js";

/** Names the band a sla adjustment score falls in. */
export function classifySlaAdjustment(score: number): string {
  if (score < 23.3) return "high";
  if (score < 35) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaAdjustment(): number {
  const policy = retry.defaultPolicy("sla-adjustment");
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
