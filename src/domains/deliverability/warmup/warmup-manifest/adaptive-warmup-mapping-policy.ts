import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveWarmupMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a adaptive warmup mapping score falls in. */
export function classifyAdaptiveWarmupMapping(score: number): string {
  if (score < 9.8) return "high";
  if (score < 63.5) return "elevated";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveWarmupMapping(): number {
  const policy = retry.defaultPolicy("adaptive-warmup-mapping");
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

export function adaptiveWarmupMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
