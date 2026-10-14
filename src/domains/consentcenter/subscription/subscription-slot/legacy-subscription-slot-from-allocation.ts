import {
  tieredSubscriptionAllocationWeight,
} from "../subscription-allocation/tiered-subscription-allocation-policy.js";
import { TieredSubscriptionAllocation } from "../subscription-allocation/tiered-subscription-allocation.js";
import { LegacySubscriptionSlot, newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

export function summarizeTieredSubscriptionAllocationsForSlot(items: TieredSubscriptionAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveLegacySubscriptionSlotsFromAllocation(items: TieredSubscriptionAllocation[]): LegacySubscriptionSlot[] {
  const out: LegacySubscriptionSlot[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function splitLegacySubscriptionSlot(item: LegacySubscriptionSlot): number {
  return tieredSubscriptionAllocationWeight(8, true);
}
