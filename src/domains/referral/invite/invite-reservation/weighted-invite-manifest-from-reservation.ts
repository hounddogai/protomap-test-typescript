import { adaptivePayoutSlotWeight } from "../../payout/reservation/adaptive-payout-slot-policy.js";
import { ManualPayoutReservation } from "../../payout/reservation/manual-payout-reservation.js";
import { WeightedInviteManifest, newWeightedInviteManifest } from "./weighted-invite-manifest.js";

export function summarizeManualPayoutReservationsForManifest(items: ManualPayoutReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveWeightedInviteManifestsFromReservation(items: ManualPayoutReservation[]): WeightedInviteManifest[] {
  const out: WeightedInviteManifest[] = [];
  for (const item of items) {
    const derived = newWeightedInviteManifest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateWeightedInviteManifest(item: WeightedInviteManifest): number {
  return adaptivePayoutSlotWeight(8, true);
}
