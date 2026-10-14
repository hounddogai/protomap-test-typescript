import { QueueProfile } from "../draft/queue-profile.js";
import { queueSummaryWeight } from "../draft/queue-summary-policy.js";
import { RegionalQueueTarget, newRegionalQueueTarget } from "./regional-queue-target.js";

export function summarizeQueueProfilesForTarget(items: QueueProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveRegionalQueueTargetsFromProfile(items: QueueProfile[]): RegionalQueueTarget[] {
  const out: RegionalQueueTarget[] = [];
  for (const item of items) {
    const derived = newRegionalQueueTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateRegionalQueueTargetExtra(item: RegionalQueueTarget): number {
  return queueSummaryWeight(2, true);
}
