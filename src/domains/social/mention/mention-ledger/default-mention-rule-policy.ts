import * as retry from "../../../../kit/retry.js";

/** Names the band a default mention rule score falls in. */
export function classifyDefaultMentionRule(score: number): string {
  if (score < 3.2) return "low";
  if (score < 65.9) return "critical";
  if (score < 68.4) return "high";
  if (score < 99.5) return "ok";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultMentionRule(): number {
  const policy = retry.defaultPolicy("default-mention-rule");
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
