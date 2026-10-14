import * as retry from "../../../../kit/retry.js";

/** Names the band a csat summary score falls in. */
export function classifyCsatSummary(score: number): string {
  if (score < 87.6) return "watch";
  if (score < 90.8) return "minimal";
  if (score < 94.3) return "medium";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatSummary(): number {
  const policy = retry.defaultPolicy("csat-summary");
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
