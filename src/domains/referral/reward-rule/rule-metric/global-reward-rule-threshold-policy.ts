import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global reward rule threshold score falls in. */
export function classifyGlobalRewardRuleThreshold(score: number): string {
  if (score < 56.4) return "low";
  if (score < 66.5) return "medium";
  if (score < 83.3) return "watch";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalRewardRuleThreshold(): number {
  const policy = retry.defaultPolicy("global-reward-rule-threshold");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeGlobalRewardRuleThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
