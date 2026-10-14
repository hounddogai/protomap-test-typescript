import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function retentionManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function retentionManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a retention manifest score falls in. */
export function classifyRetentionManifest(score: number): string {
  if (score < 2.6) return "medium";
  if (score < 7.9) return "ok";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionManifest(): number {
  const policy = retry.defaultPolicy("retention-manifest");
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
