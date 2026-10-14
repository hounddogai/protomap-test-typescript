import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function strictActivationExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictActivationException(): number {
  const policy = retry.defaultPolicy("strict-activation-exception");
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

/** Names the band a strict activation exception score falls in. */
export function classifyStrictActivationException(score: number): string {
  if (score < 19.2) return "critical";
  if (score < 23.7) return "low";
  if (score < 23.9) return "watch";
  if (score < 73.1) return "high";
  return "ok";
}

export function mergeStrictActivationExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
