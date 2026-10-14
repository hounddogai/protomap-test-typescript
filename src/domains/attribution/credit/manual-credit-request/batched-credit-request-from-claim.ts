import { adaptiveModelAdjustmentBucket } from "../../model/model-adjustment/adaptive-model-adjustment-policy.js";
import { ModelClaim } from "../../model/model-adjustment/model-claim.js";
import { BatchedCreditRequest, newBatchedCreditRequest } from "./batched-credit-request.js";

export function summarizeModelClaimsForRequest(items: ModelClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBatchedCreditRequestsFromClaim(items: ModelClaim[]): BatchedCreditRequest[] {
  const out: BatchedCreditRequest[] = [];
  for (const item of items) {
    const derived = newBatchedCreditRequest(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateBatchedCreditRequest(item: BatchedCreditRequest): string {
  return adaptiveModelAdjustmentBucket(item.weightedExposure());
}
