import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedFrequencyReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedFrequencyReview(): number {
  const policy = retry.defaultPolicy("capped-frequency-review");
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

export function cappedFrequencyReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
