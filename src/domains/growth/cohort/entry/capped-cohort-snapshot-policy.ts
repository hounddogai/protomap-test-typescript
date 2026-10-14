import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function cappedCohortSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedCohortSnapshot(): number {
  const policy = retry.defaultPolicy("capped-cohort-snapshot");
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

/** Names the band a capped cohort snapshot score falls in. */
export function classifyCappedCohortSnapshot(score: number): string {
  if (score < 86.6) return "high";
  if (score < 87.6) return "ok";
  if (score < 88.8) return "medium";
  return "elevated";
}
