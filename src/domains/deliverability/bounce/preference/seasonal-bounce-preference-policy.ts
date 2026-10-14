import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalBouncePreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalBouncePreference(): number {
  const policy = retry.defaultPolicy("seasonal-bounce-preference");
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

/** Names the band a seasonal bounce preference score falls in. */
export function classifySeasonalBouncePreference(score: number): string {
  if (score < 7.9) return "low";
  if (score < 35.4) return "critical";
  if (score < 46.8) return "elevated";
  if (score < 69.5) return "medium";
  return "high";
}
