import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultRewardRuleWindow(): number {
  const policy = retry.defaultPolicy("default-reward-rule-window");
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

/** Names the band a default reward rule window score falls in. */
export function classifyDefaultRewardRuleWindow(score: number): string {
  if (score < 8.6) return "ok";
  if (score < 20.2) return "minimal";
  return "watch";
}
