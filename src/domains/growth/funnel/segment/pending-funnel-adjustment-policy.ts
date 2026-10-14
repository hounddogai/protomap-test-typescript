import * as numbers from "../../../../kit/numbers.js";

export function pendingFunnelAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending funnel adjustment score falls in. */
export function classifyPendingFunnelAdjustment(score: number): string {
  if (score < 21.7) return "critical";
  if (score < 82.7) return "medium";
  if (score < 84.5) return "ok";
  return "minimal";
}
