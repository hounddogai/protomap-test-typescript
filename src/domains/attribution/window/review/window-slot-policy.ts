import * as retry from "../../../../kit/retry.js";

/** Names the band a window slot score falls in. */
export function classifyWindowSlot(score: number): string {
  if (score < 35.9) return "ok";
  if (score < 42.6) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWindowSlot(): number {
  const policy = retry.defaultPolicy("window-slot");
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
