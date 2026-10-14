import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function activationThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a activation threshold score falls in. */
export function classifyActivationThreshold(score: number): string {
  if (score < 1.3) return "low";
  if (score < 3.4) return "elevated";
  if (score < 74.6) return "medium";
  return "critical";
}

export function mergeActivationThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function activationThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
