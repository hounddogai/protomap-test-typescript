import * as numbers from "../../../../kit/numbers.js";

export function pendingWaitMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a pending wait milestone score falls in. */
export function classifyPendingWaitMilestone(score: number): string {
  if (score < 48.5) return "ok";
  if (score < 65.4) return "medium";
  return "elevated";
}
