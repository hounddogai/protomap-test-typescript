import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy branch target score falls in. */
export function classifyLegacyBranchTarget(score: number): string {
  if (score < 56.8) return "watch";
  if (score < 61.8) return "ok";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyBranchTarget(): number {
  const policy = retry.defaultPolicy("legacy-branch-target");
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
