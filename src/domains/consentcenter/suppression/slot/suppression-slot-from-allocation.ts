import { SubscriptionAllocation } from "../../subscription/segment/subscription-allocation.js";
import { normalizeSubscriptionSegmentCode } from "../../subscription/segment/subscription-segment-policy.js";
import { SuppressionSlot, newSuppressionSlot } from "./suppression-slot.js";

export function summarizeSubscriptionAllocationsForSlot(items: SubscriptionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSuppressionSlotsFromAllocation(items: SubscriptionAllocation[]): SuppressionSlot[] {
  const out: SuppressionSlot[] = [];
  for (const item of items) {
    const derived = newSuppressionSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveSuppressionSlot(item: SuppressionSlot): string {
  return normalizeSubscriptionSegmentCode(item.code);
}
