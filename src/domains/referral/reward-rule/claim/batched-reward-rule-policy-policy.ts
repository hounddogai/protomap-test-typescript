import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedRewardRulePolicy(): number {
  const policy = retry.defaultPolicy("batched-reward-rule-policy");
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

export function mergeBatchedRewardRulePolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedRewardRulePolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
