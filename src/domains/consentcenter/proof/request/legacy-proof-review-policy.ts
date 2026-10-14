import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function legacyProofReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyProofReview(): number {
  const policy = retry.defaultPolicy("legacy-proof-review");
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

/** Names the band a legacy proof review score falls in. */
export function classifyLegacyProofReview(score: number): string {
  if (score < 21.7) return "high";
  if (score < 36.3) return "ok";
  if (score < 54.6) return "low";
  if (score < 81.6) return "critical";
  return "medium";
}
