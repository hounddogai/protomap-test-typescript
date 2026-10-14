import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalRedemptionDraft(): number {
  const policy = retry.defaultPolicy("regional-redemption-draft");
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

/** Names the band a regional redemption draft score falls in. */
export function classifyRegionalRedemptionDraft(score: number): string {
  if (score < 1.4) return "minimal";
  if (score < 17.2) return "medium";
  if (score < 44.8) return "ok";
  if (score < 61.6) return "elevated";
  return "high";
}

export function regionalRedemptionDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function regionalRedemptionDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
