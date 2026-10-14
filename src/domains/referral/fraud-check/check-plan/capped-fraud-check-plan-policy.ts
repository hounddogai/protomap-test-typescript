import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped fraud check plan score falls in. */
export function classifyCappedFraudCheckPlan(score: number): string {
  if (score < 18.2) return "high";
  if (score < 41.5) return "ok";
  if (score < 55.7) return "low";
  return "watch";
}

export function mergeCappedFraudCheckPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedFraudCheckPlan(): number {
  const policy = retry.defaultPolicy("capped-fraud-check-plan");
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

export function cappedFraudCheckPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
