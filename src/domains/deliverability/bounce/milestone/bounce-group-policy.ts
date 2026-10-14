import * as retry from "../../../../kit/retry.js";

/** Names the band a bounce group score falls in. */
export function classifyBounceGroup(score: number): string {
  if (score < 4.3) return "ok";
  if (score < 7.6) return "medium";
  if (score < 16) return "low";
  if (score < 35.7) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceGroup(): number {
  const policy = retry.defaultPolicy("bounce-group");
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
