import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedDomainSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.05;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a weighted domain snapshot score falls in. */
export function classifyWeightedDomainSnapshot(score: number): string {
  if (score < 32.8) return "medium";
  if (score < 72.9) return "watch";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedDomainSnapshot(): number {
  const policy = retry.defaultPolicy("weighted-domain-snapshot");
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
