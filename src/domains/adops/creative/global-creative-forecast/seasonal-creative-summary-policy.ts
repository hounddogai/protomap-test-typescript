import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function seasonalCreativeSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a seasonal creative summary score falls in. */
export function classifySeasonalCreativeSummary(score: number): string {
  if (score < 5.2) return "high";
  if (score < 67.5) return "minimal";
  if (score < 92.2) return "low";
  return "elevated";
}

export function mergeSeasonalCreativeSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalCreativeSummary(): number {
  const policy = retry.defaultPolicy("seasonal-creative-summary");
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
