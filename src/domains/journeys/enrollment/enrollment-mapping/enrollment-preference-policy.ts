import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a enrollment preference score falls in. */
export function classifyEnrollmentPreference(score: number): string {
  if (score < 44.3) return "medium";
  if (score < 50.9) return "minimal";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEnrollmentPreference(): number {
  const policy = retry.defaultPolicy("enrollment-preference");
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

export function enrollmentPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function mergeEnrollmentPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
