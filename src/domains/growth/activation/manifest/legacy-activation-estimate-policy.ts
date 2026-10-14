import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyActivationEstimate(): number {
  const policy = retry.defaultPolicy("legacy-activation-estimate");
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

export function legacyActivationEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a legacy activation estimate score falls in. */
export function classifyLegacyActivationEstimate(score: number): string {
  if (score < 5.6) return "critical";
  if (score < 28) return "elevated";
  if (score < 48) return "ok";
  if (score < 73.8) return "low";
  return "minimal";
}

export function legacyActivationEstimateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
