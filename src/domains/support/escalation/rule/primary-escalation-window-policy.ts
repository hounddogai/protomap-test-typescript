import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePrimaryEscalationWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function primaryEscalationWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a primary escalation window score falls in. */
export function classifyPrimaryEscalationWindow(score: number): string {
  if (score < 39.2) return "critical";
  if (score < 66) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryEscalationWindow(): number {
  const policy = retry.defaultPolicy("primary-escalation-window");
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
