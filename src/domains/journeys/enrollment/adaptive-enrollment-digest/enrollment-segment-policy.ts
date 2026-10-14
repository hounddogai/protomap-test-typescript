import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a enrollment segment score falls in. */
export function classifyEnrollmentSegment(score: number): string {
  if (score < 10.2) return "elevated";
  if (score < 66.9) return "watch";
  if (score < 67.6) return "critical";
  if (score < 98.4) return "medium";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEnrollmentSegment(): number {
  const policy = retry.defaultPolicy("enrollment-segment");
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

export function mergeEnrollmentSegmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
