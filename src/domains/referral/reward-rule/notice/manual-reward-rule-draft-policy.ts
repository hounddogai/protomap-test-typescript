import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a manual reward rule draft score falls in. */
export function classifyManualRewardRuleDraft(score: number): string {
  if (score < 18.2) return "medium";
  if (score < 95.7) return "minimal";
  return "ok";
}

export function manualRewardRuleDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergeManualRewardRuleDraftLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualRewardRuleDraft(): number {
  const policy = retry.defaultPolicy("manual-reward-rule-draft");
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
