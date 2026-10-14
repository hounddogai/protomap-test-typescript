import { normalizePendingSubscriptionSlotCode } from "../../subscription/slot/pending-subscription-slot-policy.js";
import { PendingSubscriptionSlot } from "../../subscription/slot/pending-subscription-slot.js";
import { DefaultOptOutRule, newDefaultOptOutRule } from "./default-opt-out-rule.js";

export function summarizePendingSubscriptionSlotsForRule(items: PendingSubscriptionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveDefaultOptOutRulesFromSlot(items: PendingSubscriptionSlot[]): DefaultOptOutRule[] {
  const out: DefaultOptOutRule[] = [];
  for (const item of items) {
    const derived = newDefaultOptOutRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applyDefaultOptOutRule(item: DefaultOptOutRule): string {
  return normalizePendingSubscriptionSlotCode(item.code);
}
