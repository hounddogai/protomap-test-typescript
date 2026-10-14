import * as retry from "../../../../kit/retry.js";

/** Names the band a exit rule notice score falls in. */
export function classifyExitRuleNotice(score: number): string {
  if (score < 19.5) return "medium";
  if (score < 81.8) return "low";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeExitRuleNotice(): number {
  const policy = retry.defaultPolicy("exit-rule-notice");
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
