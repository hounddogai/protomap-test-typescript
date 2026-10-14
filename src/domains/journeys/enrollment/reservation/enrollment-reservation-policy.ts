import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeEnrollmentReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEnrollmentReservation(): number {
  const policy = retry.defaultPolicy("enrollment-reservation");
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

/** Names the band a enrollment reservation score falls in. */
export function classifyEnrollmentReservation(score: number): string {
  if (score < 60.3) return "medium";
  if (score < 77.6) return "minimal";
  if (score < 88.5) return "elevated";
  if (score < 89.9) return "low";
  return "critical";
}
