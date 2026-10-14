import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function legacyTierItemSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a legacy tier item score falls in. */
export function classifyLegacyTierItem(score: number): string {
  if (score < 7.1) return "watch";
  if (score < 27.8) return "minimal";
  if (score < 44) return "critical";
  return "medium";
}

export function legacyTierItemWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.66;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyTierItem(): number {
  const policy = retry.defaultPolicy("legacy-tier-item");
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
