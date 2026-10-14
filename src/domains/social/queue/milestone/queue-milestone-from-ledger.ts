import { InsightLedger } from "../../insight/metric/insight-ledger.js";
import { insightMetricBucket } from "../../insight/metric/insight-metric-policy.js";
import { QueueMilestone, newQueueMilestone } from "./queue-milestone.js";

export function summarizeInsightLedgersForMilestone(items: InsightLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveQueueMilestonesFromLedger(items: InsightLedger[]): QueueMilestone[] {
  const out: QueueMilestone[] = [];
  for (const item of items) {
    const derived = newQueueMilestone(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceQueueMilestone(item: QueueMilestone): string {
  return insightMetricBucket(item.measuredValue());
}
