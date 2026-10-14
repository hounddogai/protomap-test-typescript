import { normalizeAdaptiveFunnelEstimateCode } from "../lenient-funnel-request/adaptive-funnel-estimate-policy.js";
import { AdaptiveFunnelEstimate } from "../lenient-funnel-request/adaptive-funnel-estimate.js";
import { PrimaryFunnelRecord, newPrimaryFunnelRecord } from "./primary-funnel-record.js";

export function summarizeAdaptiveFunnelEstimatesForRecord(items: AdaptiveFunnelEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryFunnelRecordsFromEstimate(items: AdaptiveFunnelEstimate[]): PrimaryFunnelRecord[] {
  const out: PrimaryFunnelRecord[] = [];
  for (const item of items) {
    const derived = newPrimaryFunnelRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryFunnelRecord(item: PrimaryFunnelRecord): string {
  return normalizeAdaptiveFunnelEstimateCode(item.code);
}
