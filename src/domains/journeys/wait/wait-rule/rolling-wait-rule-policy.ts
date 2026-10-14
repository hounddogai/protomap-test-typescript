import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a rolling wait rule score falls in. */
export function classifyRollingWaitRule(score: number): string {
  if (score < 8.6) return "watch";
  if (score < 22.1) return "low";
  if (score < 48.5) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingWaitRule(): number {
  const policy = retry.defaultPolicy("rolling-wait-rule");
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

export function rollingWaitRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function mergeRollingWaitRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
