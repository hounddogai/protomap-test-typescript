import { normalizePendingSubscriptionSlotCode } from "../../subscription/slot/pending-subscription-slot-policy.js";
import { PendingSubscriptionSlot } from "../../subscription/slot/pending-subscription-slot.js";
import { AdaptiveDoubleOptInSlot, newAdaptiveDoubleOptInSlot } from "./adaptive-double-opt-in-slot.js";

export function summarizePendingSubscriptionSlotsForSlot(items: PendingSubscriptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveAdaptiveDoubleOptInSlotsFromSlot(items: PendingSubscriptionSlot[]): AdaptiveDoubleOptInSlot[] {
  const out: AdaptiveDoubleOptInSlot[] = [];
  for (const item of items) {
    const derived = newAdaptiveDoubleOptInSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function projectAdaptiveDoubleOptInSlot(item: AdaptiveDoubleOptInSlot): string {
  return normalizePendingSubscriptionSlotCode(item.code);
}
