import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientCohortQuota(): number {
  const policy = retry.defaultPolicy("lenient-cohort-quota");
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

export function mergeLenientCohortQuotaLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a lenient cohort quota score falls in. */
export function classifyLenientCohortQuota(score: number): string {
  if (score < 79.8) return "medium";
  if (score < 82.7) return "low";
  if (score < 88.4) return "watch";
  return "elevated";
}
