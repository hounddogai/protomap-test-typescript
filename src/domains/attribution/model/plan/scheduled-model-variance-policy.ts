import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a scheduled model variance score falls in. */
export function classifyScheduledModelVariance(score: number): string {
  if (score < 61.2) return "minimal";
  if (score < 68.7) return "critical";
  if (score < 86.7) return "high";
  if (score < 88.5) return "low";
  return "medium";
}

export function mergeScheduledModelVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledModelVariance(): number {
  const policy = retry.defaultPolicy("scheduled-model-variance");
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

export function scheduledModelVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
