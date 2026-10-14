import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a paywall adjustment score falls in. */
export function classifyPaywallAdjustment(score: number): string {
  if (score < 52.1) return "low";
  if (score < 75.1) return "medium";
  return "elevated";
}

export function paywallAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function mergePaywallAdjustmentLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function paywallAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.07;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
