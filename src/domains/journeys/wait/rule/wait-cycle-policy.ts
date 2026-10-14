import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitCycle(): number {
  const policy = retry.defaultPolicy("wait-cycle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a wait cycle score falls in. */
export function classifyWaitCycle(score: number): string {
  if (score < 9) return "watch";
  if (score < 27.9) return "critical";
  return "medium";
}
