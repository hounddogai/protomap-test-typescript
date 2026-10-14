import { classifyActivationAllocation } from "../../activation/allocation/activation-allocation-policy.js";
import { ActivationSegment } from "../../activation/allocation/activation-segment.js";
import { RetentionRecord, newRetentionRecord } from "./retention-record.js";

export function summarizeActivationSegmentsForRecord(items: ActivationSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRetentionRecordsFromSegment(items: ActivationSegment[]): RetentionRecord[] {
  const out: RetentionRecord[] = [];
  for (const item of items) {
    const derived = newRetentionRecord(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRetentionRecord(item: RetentionRecord): string {
  return classifyActivationAllocation(item.adjustedLoad());
}
