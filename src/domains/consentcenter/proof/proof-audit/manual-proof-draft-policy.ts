import * as retry from "../../../../kit/retry.js";

/** Names the band a manual proof draft score falls in. */
export function classifyManualProofDraft(score: number): string {
  if (score < 31.4) return "medium";
  if (score < 48.4) return "high";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualProofDraft(): number {
  const policy = retry.defaultPolicy("manual-proof-draft");
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
