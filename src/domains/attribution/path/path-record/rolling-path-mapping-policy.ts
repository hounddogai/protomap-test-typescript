import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a rolling path mapping score falls in. */
export function classifyRollingPathMapping(score: number): string {
  if (score < 12.3) return "minimal";
  if (score < 44) return "critical";
  if (score < 93.6) return "low";
  if (score < 98.6) return "medium";
  return "elevated";
}

export function rollingPathMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingPathMapping(): number {
  const policy = retry.defaultPolicy("rolling-path-mapping");
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
