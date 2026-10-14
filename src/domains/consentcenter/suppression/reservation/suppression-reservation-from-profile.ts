import { globalPreferenceBundleWeight } from "../../preference/profile/global-preference-bundle-policy.js";
import { PreferenceProfile } from "../../preference/profile/preference-profile.js";
import { SuppressionReservation, newSuppressionReservation } from "./suppression-reservation.js";

export function summarizePreferenceProfilesForReservation(items: PreferenceProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSuppressionReservationsFromProfile(items: PreferenceProfile[]): SuppressionReservation[] {
  const out: SuppressionReservation[] = [];
  for (const item of items) {
    const derived = newSuppressionReservation(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchSuppressionReservation(item: SuppressionReservation): number {
  return globalPreferenceBundleWeight(3, true);
}
