import { ManualCreditClaim } from "../../credit/credit-claim/manual-credit-claim.js";
import { manualCreditPlanWeight } from "../../credit/credit-claim/manual-credit-plan-policy.js";
import { BatchedPathQuota, newBatchedPathQuota } from "./batched-path-quota.js";

export function summarizeManualCreditClaimsForQuota(items: ManualCreditClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveBatchedPathQuotasFromClaim(items: ManualCreditClaim[]): BatchedPathQuota[] {
  const out: BatchedPathQuota[] = [];
  for (const item of items) {
    const derived = newBatchedPathQuota(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeBatchedPathQuota(item: BatchedPathQuota): number {
  return manualCreditPlanWeight(5, true);
}
