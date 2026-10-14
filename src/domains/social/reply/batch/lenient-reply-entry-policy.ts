import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function lenientReplyEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient reply entry score falls in. */
export function classifyLenientReplyEntry(score: number): string {
  if (score < 61.1) return "critical";
  if (score < 90.3) return "elevated";
  return "high";
}

export function lenientReplyEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientReplyEntry(): number {
  const policy = retry.defaultPolicy("lenient-reply-entry");
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
