import { insightBaselineBucket } from "../../insight/profile/insight-baseline-policy.js";
import { InsightBaseline } from "../../insight/profile/insight-baseline.js";
import { RollingQueueRecord, newRollingQueueRecord } from "./rolling-queue-record.js";

export function summarizeInsightBaselinesForRecord(items: InsightBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingQueueRecordsFromBaseline(items: InsightBaseline[]): RollingQueueRecord[] {
  const out: RollingQueueRecord[] = [];
  for (const item of items) {
    const derived = newRollingQueueRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planRollingQueueRecord(item: RollingQueueRecord): string {
  return insightBaselineBucket(item.projectedTotal());
}
