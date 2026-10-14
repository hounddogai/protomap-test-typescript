import { badgeDraftWeight } from "../../badge/badge-profile/badge-draft-policy.js";
import { CappedBadgeSlot } from "../../badge/badge-profile/capped-badge-slot.js";
import { PendingRedemptionPolicy, newPendingRedemptionPolicy } from "./pending-redemption-policy.js";

export function summarizeCappedBadgeSlotsForPolicy(items: CappedBadgeSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePendingRedemptionPoliciesFromSlot(items: CappedBadgeSlot[]): PendingRedemptionPolicy[] {
  const out: PendingRedemptionPolicy[] = [];
  for (const item of items) {
    const derived = newPendingRedemptionPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergePendingRedemptionPolicy(item: PendingRedemptionPolicy): number {
  return badgeDraftWeight(8, true);
}
