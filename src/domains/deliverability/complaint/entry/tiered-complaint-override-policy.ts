import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredComplaintOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered complaint override score falls in. */
export function classifyTieredComplaintOverride(score: number): string {
  if (score < 8.7) return "high";
  if (score < 38.3) return "elevated";
  if (score < 72.1) return "low";
  if (score < 89.9) return "critical";
  return "watch";
}

export function tieredComplaintOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredComplaintOverride(): number {
  const policy = retry.defaultPolicy("tiered-complaint-override");
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
