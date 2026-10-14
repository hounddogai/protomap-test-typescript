import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientRewardRuleCheckpoint(): number {
  const policy = retry.defaultPolicy("lenient-reward-rule-checkpoint");
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

/** Names the band a lenient reward rule checkpoint score falls in. */
export function classifyLenientRewardRuleCheckpoint(score: number): string {
  if (score < 13.3) return "elevated";
  if (score < 52.4) return "minimal";
  return "watch";
}
