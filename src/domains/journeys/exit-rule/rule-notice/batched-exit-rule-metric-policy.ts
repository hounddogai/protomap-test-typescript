import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedExitRuleMetric(): number {
  const policy = retry.defaultPolicy("batched-exit-rule-metric");
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

/** Names the band a batched exit rule metric score falls in. */
export function classifyBatchedExitRuleMetric(score: number): string {
  if (score < 15.4) return "ok";
  if (score < 55) return "low";
  if (score < 88.8) return "minimal";
  if (score < 94.3) return "watch";
  return "elevated";
}

export function batchedExitRuleMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function mergeBatchedExitRuleMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
