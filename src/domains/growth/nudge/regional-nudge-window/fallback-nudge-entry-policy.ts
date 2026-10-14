import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackNudgeEntry(): number {
  const policy = retry.defaultPolicy("fallback-nudge-entry");
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

/** Names the band a fallback nudge entry score falls in. */
export function classifyFallbackNudgeEntry(score: number): string {
  if (score < 23.5) return "high";
  if (score < 42.3) return "ok";
  if (score < 61.2) return "critical";
  if (score < 86) return "medium";
  return "low";
}
