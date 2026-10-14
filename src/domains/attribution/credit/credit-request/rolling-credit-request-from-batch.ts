import { normalizeModelBatchCode } from "../../model/assignment/model-batch-policy.js";
import { ModelBatch } from "../../model/assignment/model-batch.js";
import { RollingCreditRequest, newRollingCreditRequest } from "./rolling-credit-request.js";

export function summarizeModelBatchesForRequest(items: ModelBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRollingCreditRequestsFromBatch(items: ModelBatch[]): RollingCreditRequest[] {
  const out: RollingCreditRequest[] = [];
  for (const item of items) {
    const derived = newRollingCreditRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingCreditRequest(item: RollingCreditRequest): string {
  return normalizeModelBatchCode(item.code);
}
