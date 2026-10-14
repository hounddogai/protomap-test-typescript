import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditDraft(): number {
  const policy = retry.defaultPolicy("credit-draft");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a credit draft score falls in. */
export function classifyCreditDraft(score: number): string {
  if (score < 43.1) return "elevated";
  if (score < 82.3) return "minimal";
  return "high";
}
