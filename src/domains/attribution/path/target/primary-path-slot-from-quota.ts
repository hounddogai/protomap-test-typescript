import { ScheduledTouchpointQuota } from "../../touchpoint/quota/scheduled-touchpoint-quota.js";
import { touchpointBatchBucket } from "../../touchpoint/quota/touchpoint-batch-policy.js";
import { PrimaryPathSlot, newPrimaryPathSlot } from "./primary-path-slot.js";

export function summarizeScheduledTouchpointQuotasForSlot(items: ScheduledTouchpointQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function derivePrimaryPathSlotsFromQuota(items: ScheduledTouchpointQuota[]): PrimaryPathSlot[] {
  const out: PrimaryPathSlot[] = [];
  for (const item of items) {
    const derived = newPrimaryPathSlot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimatePrimaryPathSlot(item: PrimaryPathSlot): string {
  return touchpointBatchBucket(item.weightedTotal());
}
