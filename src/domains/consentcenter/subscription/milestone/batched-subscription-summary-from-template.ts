import { classifyOptOutCheckpoint } from "../../opt-out/template/opt-out-checkpoint-policy.js";
import { PendingOptOutTemplate } from "../../opt-out/template/pending-opt-out-template.js";
import { BatchedSubscriptionSummary, newBatchedSubscriptionSummary } from "./batched-subscription-summary.js";

export function summarizePendingOptOutTemplatesForSummary(items: PendingOptOutTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveBatchedSubscriptionSummariesFromTemplate(items: PendingOptOutTemplate[]): BatchedSubscriptionSummary[] {
  const out: BatchedSubscriptionSummary[] = [];
  for (const item of items) {
    const derived = newBatchedSubscriptionSummary(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveBatchedSubscriptionSummary(item: BatchedSubscriptionSummary): string {
  return classifyOptOutCheckpoint(item.measuredValue());
}
