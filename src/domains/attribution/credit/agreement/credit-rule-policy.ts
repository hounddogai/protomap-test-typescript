import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCreditRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a credit rule score falls in. */
export function classifyCreditRule(score: number): string {
  if (score < 42) return "critical";
  if (score < 47.1) return "elevated";
  if (score < 57.3) return "medium";
  if (score < 58.5) return "high";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreditRule(): number {
  const policy = retry.defaultPolicy("credit-rule");
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
