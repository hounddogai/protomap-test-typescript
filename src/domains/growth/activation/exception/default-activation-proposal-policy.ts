import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultActivationProposal(): number {
  const policy = retry.defaultPolicy("default-activation-proposal");
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

/** Names the band a default activation proposal score falls in. */
export function classifyDefaultActivationProposal(score: number): string {
  if (score < 5.7) return "critical";
  if (score < 7.1) return "ok";
  if (score < 79.4) return "minimal";
  if (score < 84.9) return "high";
  return "low";
}
