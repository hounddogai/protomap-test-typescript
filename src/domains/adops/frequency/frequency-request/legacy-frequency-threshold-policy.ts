import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a legacy frequency threshold score falls in. */
export function classifyLegacyFrequencyThreshold(score: number): string {
  if (score < 23.8) return "elevated";
  if (score < 23.9) return "ok";
  if (score < 79.1) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyFrequencyThreshold(): number {
  const policy = retry.defaultPolicy("legacy-frequency-threshold");
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

export function mergeLegacyFrequencyThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
