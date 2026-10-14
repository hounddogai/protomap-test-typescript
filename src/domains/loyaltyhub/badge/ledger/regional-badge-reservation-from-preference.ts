import { tieredLevelPreferenceWeight } from "../../level/preference/tiered-level-preference-policy.js";
import { TieredLevelPreference } from "../../level/preference/tiered-level-preference.js";
import { RegionalBadgeReservation, newRegionalBadgeReservation } from "./regional-badge-reservation.js";

export function summarizeTieredLevelPreferencesForReservation(items: TieredLevelPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRegionalBadgeReservationsFromPreference(items: TieredLevelPreference[]): RegionalBadgeReservation[] {
  const out: RegionalBadgeReservation[] = [];
  for (const item of items) {
    const derived = newRegionalBadgeReservation(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRegionalBadgeReservation(item: RegionalBadgeReservation): number {
  return tieredLevelPreferenceWeight(5, true);
}
