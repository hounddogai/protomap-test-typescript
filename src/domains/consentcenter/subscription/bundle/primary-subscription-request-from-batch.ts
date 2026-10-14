import { defaultProofBatchBucket } from "../../proof/quota/default-proof-batch-policy.js";
import { DefaultProofBatch } from "../../proof/quota/default-proof-batch.js";
import { PrimarySubscriptionRequest, newPrimarySubscriptionRequest } from "./primary-subscription-request.js";

export function summarizeDefaultProofBatchesForRequest(items: DefaultProofBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function derivePrimarySubscriptionRequestsFromBatch(items: DefaultProofBatch[]): PrimarySubscriptionRequest[] {
  const out: PrimarySubscriptionRequest[] = [];
  for (const item of items) {
    const derived = newPrimarySubscriptionRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planPrimarySubscriptionRequest(item: PrimarySubscriptionRequest): string {
  return defaultProofBatchBucket(item.netValue());
}
