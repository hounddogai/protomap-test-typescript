import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBouncePolicy(): number {
  const policy = retry.defaultPolicy("bounce-policy");
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

/** Names the band a bounce policy score falls in. */
export function classifyBouncePolicy(score: number): string {
  if (score < 13.2) return "low";
  if (score < 19.6) return "high";
  if (score < 33.6) return "elevated";
  if (score < 36.8) return "ok";
  return "medium";
}
