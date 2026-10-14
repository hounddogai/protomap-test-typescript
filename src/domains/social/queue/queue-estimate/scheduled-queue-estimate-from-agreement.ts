import { PendingInsightAgreement } from "../../insight/agreement/pending-insight-agreement.js";
import { regionalInsightGroupWeight } from "../../insight/agreement/regional-insight-group-policy.js";
import { ScheduledQueueEstimate, newScheduledQueueEstimate } from "./scheduled-queue-estimate.js";

export function summarizePendingInsightAgreementsForEstimate(items: PendingInsightAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveScheduledQueueEstimatesFromAgreement(items: PendingInsightAgreement[]): ScheduledQueueEstimate[] {
  const out: ScheduledQueueEstimate[] = [];
  for (const item of items) {
    const derived = newScheduledQueueEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledQueueEstimate(item: ScheduledQueueEstimate): number {
  return regionalInsightGroupWeight(1, true);
}
