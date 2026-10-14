import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeJourneyMapping(): number {
  const policy = retry.defaultPolicy("journey-mapping");
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

export function mergeJourneyMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a journey mapping score falls in. */
export function classifyJourneyMapping(score: number): string {
  if (score < 31.3) return "minimal";
  if (score < 43) return "watch";
  if (score < 62.7) return "low";
  if (score < 67.3) return "elevated";
  return "ok";
}
