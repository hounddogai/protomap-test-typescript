import * as numbers from "../../../../kit/numbers.js";

export function batchedApprovalQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a batched approval quota score falls in. */
export function classifyBatchedApprovalQuota(score: number): string {
  if (score < 13.7) return "high";
  if (score < 51.7) return "medium";
  return "low";
}
