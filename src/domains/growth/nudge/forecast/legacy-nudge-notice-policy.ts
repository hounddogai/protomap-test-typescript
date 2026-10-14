import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy nudge notice score falls in. */
export function classifyLegacyNudgeNotice(score: number): string {
  if (score < 24.5) return "minimal";
  if (score < 50.7) return "medium";
  if (score < 61.9) return "elevated";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyNudgeNotice(): number {
  const policy = retry.defaultPolicy("legacy-nudge-notice");
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
