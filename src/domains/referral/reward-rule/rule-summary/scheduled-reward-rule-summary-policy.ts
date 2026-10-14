import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledRewardRuleSummary(): number {
  const policy = retry.defaultPolicy("scheduled-reward-rule-summary");
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

export function scheduledRewardRuleSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function mergeScheduledRewardRuleSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a scheduled reward rule summary score falls in. */
export function classifyScheduledRewardRuleSummary(score: number): string {
  if (score < 33.1) return "low";
  if (score < 33.7) return "elevated";
  if (score < 44.2) return "ok";
  if (score < 87.8) return "minimal";
  return "critical";
}
