import { normalizeSeasonalCreditReservationCode } from "../../credit/notice/seasonal-credit-reservation-policy.js";
import { SeasonalCreditReservation } from "../../credit/notice/seasonal-credit-reservation.js";
import { StrictWindowPreference, newStrictWindowPreference } from "./strict-window-preference.js";

export function summarizeSeasonalCreditReservationsForPreference(items: SeasonalCreditReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveStrictWindowPreferencesFromReservation(items: SeasonalCreditReservation[]): StrictWindowPreference[] {
  const out: StrictWindowPreference[] = [];
  for (const item of items) {
    const derived = newStrictWindowPreference(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankStrictWindowPreference(item: StrictWindowPreference): string {
  return normalizeSeasonalCreditReservationCode(item.code);
}
