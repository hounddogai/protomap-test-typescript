import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a tier manifest score falls in. */
export function classifyTierManifest(score: number): string {
  if (score < 1.1) return "medium";
  if (score < 69.3) return "minimal";
  return "critical";
}

export function tierManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTierManifest(): number {
  const policy = retry.defaultPolicy("tier-manifest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function tierManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
