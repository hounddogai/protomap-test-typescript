import * as retry from "../../../../kit/retry.js";

/** Names the band a seasonal complaint agreement score falls in. */
export function classifySeasonalComplaintAgreement(score: number): string {
  if (score < 29.4) return "high";
  if (score < 46.3) return "ok";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalComplaintAgreement(): number {
  const policy = retry.defaultPolicy("seasonal-complaint-agreement");
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
