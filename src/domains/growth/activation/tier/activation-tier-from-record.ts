import { FunnelRecord } from "../../funnel/slot/funnel-record.js";
import { scheduledFunnelSlotWeight } from "../../funnel/slot/scheduled-funnel-slot-policy.js";
import { ActivationTier, newActivationTier } from "./activation-tier.js";

export function summarizeFunnelRecordsForTier(items: FunnelRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveActivationTiersFromRecord(items: FunnelRecord[]): ActivationTier[] {
  const out: ActivationTier[] = [];
  for (const item of items) {
    const derived = newActivationTier(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignActivationTier(item: ActivationTier): number {
  return scheduledFunnelSlotWeight(4, true);
}
