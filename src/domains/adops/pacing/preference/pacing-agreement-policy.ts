import * as retry from "../../../../kit/retry.js";

/** Names the band a pacing agreement score falls in. */
export function classifyPacingAgreement(score: number): string {
  if (score < 28.7) return "medium";
  if (score < 59.6) return "elevated";
  if (score < 66.7) return "watch";
  if (score < 97.5) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingAgreement(): number {
  const policy = retry.defaultPolicy("pacing-agreement");
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
