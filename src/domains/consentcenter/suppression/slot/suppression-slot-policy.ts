import * as retry from "../../../../kit/retry.js";

/** Names the band a suppression slot score falls in. */
export function classifySuppressionSlot(score: number): string {
  if (score < 14.1) return "medium";
  if (score < 17.4) return "ok";
  if (score < 96.3) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionSlot(): number {
  const policy = retry.defaultPolicy("suppression-slot");
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
