import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a adaptive exit rule window score falls in. */
export function classifyAdaptiveExitRuleWindow(score: number): string {
  if (score < 10.9) return "critical";
  if (score < 75.7) return "ok";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveExitRuleWindow(): number {
  const policy = retry.defaultPolicy("adaptive-exit-rule-window");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function adaptiveExitRuleWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function mergeAdaptiveExitRuleWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
