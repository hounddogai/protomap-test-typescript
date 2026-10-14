import { PrimaryActivationReservation } from "../../activation/proposal/primary-activation-reservation.js";
import { seasonalActivationExceptionBucket } from "../../activation/proposal/seasonal-activation-exception-policy.js";
import { ManualPaywallClaim, newManualPaywallClaim } from "./manual-paywall-claim.js";

export function summarizePrimaryActivationReservationsForClaim(items: PrimaryActivationReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualPaywallClaimsFromReservation(items: PrimaryActivationReservation[]): ManualPaywallClaim[] {
  const out: ManualPaywallClaim[] = [];
  for (const item of items) {
    const derived = newManualPaywallClaim(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchManualPaywallClaim(item: ManualPaywallClaim): string {
  return seasonalActivationExceptionBucket(item.adjustedExposure());
}
