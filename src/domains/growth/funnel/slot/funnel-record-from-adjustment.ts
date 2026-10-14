import { normalizeRetentionAdjustmentCode } from "../../retention/adjustment/retention-adjustment-policy.js";
import { RetentionAdjustment } from "../../retention/adjustment/retention-adjustment.js";
import { FunnelRecord, newFunnelRecord } from "./funnel-record.js";

export function summarizeRetentionAdjustmentsForRecord(items: RetentionAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFunnelRecordsFromAdjustment(items: RetentionAdjustment[]): FunnelRecord[] {
  const out: FunnelRecord[] = [];
  for (const item of items) {
    const derived = newFunnelRecord(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitFunnelRecord(item: FunnelRecord): string {
  return normalizeRetentionAdjustmentCode(item.code);
}
