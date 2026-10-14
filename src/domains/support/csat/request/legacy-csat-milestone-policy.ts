import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyCsatMilestone(): number {
  const policy = retry.defaultPolicy("legacy-csat-milestone");
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

/** Names the band a legacy csat milestone score falls in. */
export function classifyLegacyCsatMilestone(score: number): string {
  if (score < 28.3) return "watch";
  if (score < 36.8) return "ok";
  if (score < 89.1) return "minimal";
  return "low";
}

export function mergeLegacyCsatMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacyCsatMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
