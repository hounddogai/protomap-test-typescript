import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveDomainSnapshot(): number {
  const policy = retry.defaultPolicy("adaptive-domain-snapshot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a adaptive domain snapshot score falls in. */
export function classifyAdaptiveDomainSnapshot(score: number): string {
  if (score < 28.6) return "minimal";
  if (score < 76.5) return "high";
  return "ok";
}

export function adaptiveDomainSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
