import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy step score score falls in. */
export function classifyLegacyStepScore(score: number): string {
  if (score < 43.1) return "critical";
  if (score < 72) return "medium";
  if (score < 87.2) return "minimal";
  if (score < 90.1) return "watch";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyStepScore(): number {
  const policy = retry.defaultPolicy("legacy-step-score");
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

export function legacyStepScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
