import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeRegionalExitRuleNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a regional exit rule notice score falls in. */
export function classifyRegionalExitRuleNotice(score: number): string {
  if (score < 2.8) return "critical";
  if (score < 10.2) return "minimal";
  if (score < 45.6) return "high";
  if (score < 64.7) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalExitRuleNotice(): number {
  const policy = retry.defaultPolicy("regional-exit-rule-notice");
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
