import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingPolicy(): number {
  const policy = retry.defaultPolicy("pacing-policy");
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

/** Names the band a pacing policy score falls in. */
export function classifyPacingPolicy(score: number): string {
  if (score < 13.4) return "critical";
  if (score < 73.7) return "ok";
  if (score < 76.2) return "high";
  return "minimal";
}
