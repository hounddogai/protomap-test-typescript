import { primaryOptOutClaimWeight } from "../../opt-out/assignment/primary-opt-out-claim-policy.js";
import { PrimaryOptOutClaim } from "../../opt-out/assignment/primary-opt-out-claim.js";
import { SubscriptionSlot, newSubscriptionSlot } from "./subscription-slot.js";

export function summarizePrimaryOptOutClaimsForSlot(items: PrimaryOptOutClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveSubscriptionSlotsFromClaim(items: PrimaryOptOutClaim[]): SubscriptionSlot[] {
  const out: SubscriptionSlot[] = [];
  for (const item of items) {
    const derived = newSubscriptionSlot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeSubscriptionSlot(item: SubscriptionSlot): number {
  return primaryOptOutClaimWeight(8, true);
}
