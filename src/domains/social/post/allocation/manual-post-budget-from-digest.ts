import { QueueDigest } from "../../queue/record-item/queue-digest.js";
import { queueGroupWeight } from "../../queue/record-item/queue-group-policy.js";
import { ManualPostBudget, newManualPostBudget } from "./manual-post-budget.js";

export function summarizeQueueDigestsForBudget(items: QueueDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveManualPostBudgetsFromDigest(items: QueueDigest[]): ManualPostBudget[] {
  const out: ManualPostBudget[] = [];
  for (const item of items) {
    const derived = newManualPostBudget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateManualPostBudget(item: ManualPostBudget): number {
  return queueGroupWeight(7, true);
}
