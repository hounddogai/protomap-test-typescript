import * as numbers from "../../../../kit/numbers.js";

/** Names the band a pending approval bundle score falls in. */
export function classifyPendingApprovalBundle(score: number): string {
  if (score < 73.6) return "minimal";
  if (score < 73.7) return "elevated";
  if (score < 75.1) return "medium";
  return "critical";
}

export function pendingApprovalBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function pendingApprovalBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
