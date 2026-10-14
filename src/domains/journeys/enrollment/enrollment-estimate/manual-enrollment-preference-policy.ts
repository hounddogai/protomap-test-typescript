import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeManualEnrollmentPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualEnrollmentPreference(): number {
  const policy = retry.defaultPolicy("manual-enrollment-preference");
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

export function manualEnrollmentPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function manualEnrollmentPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
