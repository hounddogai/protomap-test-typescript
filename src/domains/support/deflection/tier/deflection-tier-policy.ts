import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function deflectionTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function deflectionTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a deflection tier score falls in. */
export function classifyDeflectionTier(score: number): string {
  if (score < 22.3) return "elevated";
  if (score < 24) return "ok";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionTier(): number {
  const policy = retry.defaultPolicy("deflection-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
