import { legacyFlightClaimWeight } from "../../flight/checkpoint/legacy-flight-claim-policy.js";
import { LegacyFlightClaim } from "../../flight/checkpoint/legacy-flight-claim.js";
import { PendingFrequencyTarget, newPendingFrequencyTarget } from "./pending-frequency-target.js";

export function summarizeLegacyFlightClaimsForTarget(items: LegacyFlightClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function derivePendingFrequencyTargetsFromClaim(items: LegacyFlightClaim[]): PendingFrequencyTarget[] {
  const out: PendingFrequencyTarget[] = [];
  for (const item of items) {
    const derived = newPendingFrequencyTarget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balancePendingFrequencyTarget(item: PendingFrequencyTarget): number {
  return legacyFlightClaimWeight(6, true);
}
