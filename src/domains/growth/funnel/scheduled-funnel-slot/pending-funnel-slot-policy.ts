import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function pendingFunnelSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending funnel slot score falls in. */
export function classifyPendingFunnelSlot(score: number): string {
  if (score < 38.1) return "low";
  if (score < 53.6) return "watch";
  if (score < 54.2) return "high";
  if (score < 66.5) return "critical";
  return "elevated";
}

export function mergePendingFunnelSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
