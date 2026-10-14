import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a pending exit rule preference score falls in. */
export function classifyPendingExitRulePreference(score: number): string {
  if (score < 27.3) return "watch";
  if (score < 82.5) return "low";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingExitRulePreference(): number {
  const policy = retry.defaultPolicy("pending-exit-rule-preference");
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

export function mergePendingExitRulePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
