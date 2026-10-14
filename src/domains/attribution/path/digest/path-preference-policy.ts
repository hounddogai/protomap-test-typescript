import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergePathPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a path preference score falls in. */
export function classifyPathPreference(score: number): string {
  if (score < 30.3) return "minimal";
  if (score < 90.4) return "critical";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePathPreference(): number {
  const policy = retry.defaultPolicy("path-preference");
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
