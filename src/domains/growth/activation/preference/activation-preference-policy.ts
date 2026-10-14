import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function activationPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a activation preference score falls in. */
export function classifyActivationPreference(score: number): string {
  if (score < 38.7) return "high";
  if (score < 49.9) return "medium";
  if (score < 77.2) return "critical";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationPreference(): number {
  const policy = retry.defaultPolicy("activation-preference");
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

export function mergeActivationPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
