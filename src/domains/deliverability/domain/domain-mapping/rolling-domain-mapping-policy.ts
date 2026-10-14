import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingDomainMapping(): number {
  const policy = retry.defaultPolicy("rolling-domain-mapping");
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

/** Names the band a rolling domain mapping score falls in. */
export function classifyRollingDomainMapping(score: number): string {
  if (score < 11.1) return "medium";
  if (score < 11.1) return "low";
  if (score < 26) return "minimal";
  if (score < 43.6) return "critical";
  return "ok";
}

export function rollingDomainMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function mergeRollingDomainMappingLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
